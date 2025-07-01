const fs = require('fs-extra');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const chalk = require('chalk');
const Logger = require('./logger');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class AIPerformanceMonitor {
    constructor() {
        this.logger = new Logger('AI-Monitor');
        this.benchmarkResultsPath = path.join(__dirname, 'benchmark_results.csv');
        this.benchmarkQuestions = this.initializeBenchmarkQuestions();
        
        // Initialize Anthropic client for real AI calls
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        this.csvWriter = createCsvWriter({
            path: this.benchmarkResultsPath,
            header: [
                { id: 'timestamp', title: 'Timestamp' },
                { id: 'testId', title: 'Test_ID' },
                { id: 'category', title: 'Category' },
                { id: 'question', title: 'Question' },
                { id: 'aiResponse', title: 'AI_Response' },
                { id: 'correctAnswer', title: 'Correct_Answer' },
                { id: 'accuracyScore', title: 'Accuracy_Score' },
                { id: 'timeScore', title: 'Time_Score' },
                { id: 'totalScore', title: 'Total_Score' },
                { id: 'responseTimeMs', title: 'Response_Time_Ms' }
            ],
            append: true
        });
        
        this.initializeResultsFile();
    }

    initializeBenchmarkQuestions() {
        return [
            // SQL Database Questions (4)
            {
                id: 'sql_join_complex',
                category: 'SQL_Database',
                question: "Write a SQL query to find all customers who have made more than 3 orders in the last 6 months, along with their total order value. Use tables: customers(id, name), orders(id, customer_id, order_date, total_amount).",
                correctAnswer: "SELECT c.id, c.name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_value FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY c.id, c.name HAVING COUNT(o.id) > 3;",
                points: 12
            },
            {
                id: 'sql_window_function',
                category: 'SQL_Database',
                question: "Create a query to rank employees by salary within each department and show only the top 2 highest paid employees per department. Use table: employees(id, name, department_id, salary).",
                correctAnswer: "SELECT id, name, department_id, salary, rank FROM (SELECT id, name, department_id, salary, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank FROM employees) ranked WHERE rank <= 2;",
                points: 12
            },
            {
                id: 'sql_subquery_optimization',
                category: 'SQL_Database',
                question: "Optimize this query: SELECT * FROM products WHERE category_id IN (SELECT id FROM categories WHERE name = 'Electronics' OR name = 'Computers');",
                correctAnswer: "SELECT p.* FROM products p JOIN categories c ON p.category_id = c.id WHERE c.name IN ('Electronics', 'Computers'); -- Using JOIN instead of subquery for better performance",
                points: 12
            },
            {
                id: 'sql_pivot_data',
                category: 'SQL_Database',
                question: "Write a query to pivot monthly sales data showing months as columns. Table: sales(month, product_category, amount). Show product categories as rows and months as columns with total amounts.",
                correctAnswer: "SELECT product_category, SUM(CASE WHEN month = 'Jan' THEN amount ELSE 0 END) as Jan, SUM(CASE WHEN month = 'Feb' THEN amount ELSE 0 END) as Feb, SUM(CASE WHEN month = 'Mar' THEN amount ELSE 0 END) as Mar FROM sales GROUP BY product_category;",
                points: 12
            },

            // Bug Identification Questions (4)
            {
                id: 'bug_memory_leak',
                category: 'Bug_Identification',
                question: "Find the bug in this JavaScript code: ```function createHandlers(items) { const handlers = []; for (var i = 0; i < items.length; i++) { handlers.push(function() { console.log('Item:', items[i]); }); } return handlers; }```",
                correctAnswer: "The bug is closure variable capture. The variable 'i' is shared across all functions, so when called, all handlers will log 'Item: undefined' because i equals items.length. Fix: use 'let i' instead of 'var i' or create a closure: handlers.push((function(index) { return function() { console.log('Item:', items[index]); }; })(i));",
                points: 12
            },
            {
                id: 'bug_race_condition',
                category: 'Bug_Identification',
                question: "Identify the concurrency bug: ```async function updateCounter() { const current = await getCurrentCount(); const newCount = current + 1; await saveCount(newCount); }``` Multiple calls to updateCounter() run simultaneously.",
                correctAnswer: "Race condition bug. Multiple simultaneous calls can read the same 'current' value before any saves it, causing lost updates. Fix: Use atomic operations, database transactions, or locking mechanisms. Example: UPDATE counter SET count = count + 1 WHERE id = ?; or use mutex/semaphore.",
                points: 12
            },
            {
                id: 'bug_null_pointer',
                category: 'Bug_Identification',
                question: "Find the potential bug: ```public String processUser(User user) { String name = user.getName().trim(); if (name.length() > 0) { return name.toUpperCase(); } return 'Anonymous'; }```",
                correctAnswer: "Potential NullPointerException. If user.getName() returns null, calling .trim() will throw NPE. Fix: String name = user.getName(); if (name != null) { name = name.trim(); if (name.length() > 0) return name.toUpperCase(); } return 'Anonymous';",
                points: 12
            },
            {
                id: 'bug_buffer_overflow',
                category: 'Bug_Identification',
                question: "Identify the security vulnerability: ```char buffer[10]; printf('Enter name: '); gets(buffer); printf('Hello %s!', buffer);```",
                correctAnswer: "Buffer overflow vulnerability. gets() doesn't check buffer bounds, allowing attackers to overwrite memory and potentially execute arbitrary code. Fix: Use fgets(buffer, sizeof(buffer), stdin) or scanf('%9s', buffer) to limit input size.",
                points: 12
            },

            // Code Completion Questions (4)
            {
                id: 'code_binary_search',
                category: 'Code_Completion',
                question: "Complete this binary search function: ```function binarySearch(arr, target) { let left = 0, right = arr.length - 1; while (left <= right) { let mid = ___; if (arr[mid] === target) return mid; if (arr[mid] < target) ___; else ___; } return -1; }```",
                correctAnswer: "let mid = Math.floor((left + right) / 2); if (arr[mid] < target) left = mid + 1; else right = mid - 1;",
                points: 12
            },
            {
                id: 'code_promise_chain',
                category: 'Code_Completion',
                question: "Complete the Promise chain: ```fetchUser(id).then(user => { return ___; }).then(profile => { return ___; }).catch(error => { ___; });``` The chain should fetch user, then fetch their profile, then handle errors.",
                correctAnswer: "return fetchProfile(user.profileId); }).then(profile => { return processProfile(profile); }).catch(error => { console.error('Error in chain:', error); throw error;",
                points: 12
            },
            {
                id: 'code_recursive_factorial',
                category: 'Code_Completion',
                question: "Complete the recursive factorial function with memoization: ```const memo = {}; function factorial(n) { if (___) return 1; if (___) return memo[n]; return memo[n] = ___; }```",
                correctAnswer: "if (n <= 1) return 1; if (memo[n]) return memo[n]; return memo[n] = n * factorial(n - 1);",
                points: 12
            },
            {
                id: 'code_regex_validation',
                category: 'Code_Completion',
                question: "Complete the email validation regex: ```const emailRegex = /^[___]+@[___]+\\.[___]+$/; function isValidEmail(email) { return ___; }```",
                correctAnswer: "const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/; function isValidEmail(email) { return emailRegex.test(email); }",
                points: 12
            },

            // Logic/Algorithm Questions (4)
            {
                id: 'algo_two_sum',
                category: 'Logic_Algorithm',
                question: "Given an array of integers and a target sum, find two numbers that add up to the target. Return their indices. Optimize for O(n) time complexity.",
                correctAnswer: "Use hash map: function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement), i]; map.set(nums[i], i); } return []; }",
                points: 12
            },
            {
                id: 'algo_palindrome_check',
                category: 'Logic_Algorithm',
                question: "Design an efficient algorithm to check if a linked list is a palindrome without using extra space proportional to input size.",
                correctAnswer: "1) Find middle using slow/fast pointers 2) Reverse second half 3) Compare first half with reversed second half 4) Restore list. Code: Use two pointers, reverse in-place, compare, then restore original structure.",
                points: 12
            },
            {
                id: 'algo_merge_intervals',
                category: 'Logic_Algorithm',
                question: "Given intervals [[1,3],[2,6],[8,10],[15,18]], merge overlapping intervals. What's the algorithm and result?",
                correctAnswer: "1) Sort by start time 2) Iterate and merge overlapping intervals. Result: [[1,6],[8,10],[15,18]]. Algorithm: for each interval, if it overlaps with previous merged interval, extend the end time; otherwise add new interval.",
                points: 12
            },
            {
                id: 'algo_lru_cache',
                category: 'Logic_Algorithm',
                question: "Design an LRU (Least Recently Used) cache with O(1) get and put operations. What data structures would you use?",
                correctAnswer: "Use HashMap + Doubly Linked List. HashMap stores key->node mapping for O(1) access. Doubly linked list maintains order (head=most recent, tail=least recent). On access: move to head. On capacity exceed: remove tail.",
                points: 12
            },

            // API Integration Questions (4)
            {
                id: 'api_rest_design',
                category: 'API_Integration',
                question: "Design RESTful API endpoints for a blog system with posts, comments, and users. Include proper HTTP methods and status codes.",
                correctAnswer: "GET /posts (200), POST /posts (201), GET /posts/:id (200/404), PUT /posts/:id (200/404), DELETE /posts/:id (204/404), GET /posts/:id/comments (200), POST /posts/:id/comments (201), GET /users/:id (200/404), POST /users (201)",
                points: 12
            },
            {
                id: 'api_error_handling',
                category: 'API_Integration',
                question: "How would you handle API rate limiting, retries, and circuit breaker pattern in a microservices architecture?",
                correctAnswer: "Rate limiting: Token bucket algorithm, Redis counters. Retries: Exponential backoff with jitter. Circuit breaker: Monitor failure rates, open circuit after threshold, half-open for testing, close when healthy. Use libraries like Hystrix or Resilience4j.",
                points: 12
            },
            {
                id: 'api_authentication',
                category: 'API_Integration',
                question: "Compare JWT vs OAuth 2.0 vs API Keys for different API security scenarios. When would you use each?",
                correctAnswer: "JWT: Stateless auth, microservices, short-lived tokens with refresh. OAuth 2.0: Third-party access, user consent, social login. API Keys: Simple service-to-service, internal APIs, rate limiting. JWT for distributed systems, OAuth for user delegation, API keys for service auth.",
                points: 12
            },
            {
                id: 'api_graphql_optimization',
                category: 'API_Integration',
                question: "How do you solve the N+1 query problem in GraphQL? Provide a solution with data loaders.",
                correctAnswer: "Use DataLoader pattern: Batch multiple requests in single tick, deduplicate keys, cache results. Example: const userLoader = new DataLoader(ids => User.findByIds(ids)); In resolver: return userLoader.load(userId); This batches database queries instead of making N separate calls.",
                points: 12
            }
        ];
    }

    async initializeResultsFile() {
        try {
            await this.logger.logProcessStep('Initialize Results File', 'STARTED');
            if (!await fs.pathExists(this.benchmarkResultsPath)) {
                await this.csvWriter.writeRecords([]);
                await this.logger.logFileOperation('CREATE', this.benchmarkResultsPath, true, { type: 'CSV', purpose: 'benchmark_results' });
                await this.logger.success('Created benchmark results file');
            } else {
                await this.logger.info('Benchmark results file already exists');
            }
            await this.logger.logProcessStep('Initialize Results File', 'COMPLETED');
        } catch (error) {
            await this.logger.logProcessStep('Initialize Results File', 'FAILED', { error: error.message });
            await this.logger.error('Error initializing results file', { error: error.message, stack: error.stack });
        }
    }

    async runBenchmarkTest() {
        await this.logger.logTestStart('AI Performance Benchmark Test', 20);
        await this.logger.info('🚀 AI PERFORMANCE BENCHMARK START');
        await this.logger.info('Test Configuration', {
            totalQuestions: 20,
            categories: 5,
            maxPoints: 240,
            scoringSystem: '10 accuracy + 2 speed bonus per question'
        });

        console.log(chalk.blue.bold('\n🚀 AI PERFORMANCE BENCHMARK TEST'));
        console.log(chalk.blue('====================================='));
        console.log(chalk.white('20 Questions • 5 Categories • 240 Points Total'));
        console.log(chalk.gray('Each question: 10 accuracy points + 2 speed bonus points\n'));

        const results = [];
        let totalScore = 0;
        const categoryScores = {};

        // Shuffle questions to prevent memorization
        const shuffledQuestions = [...this.benchmarkQuestions].sort(() => Math.random() - 0.5);
        await this.logger.process('Questions shuffled to prevent memorization', { totalQuestions: shuffledQuestions.length });

        for (let i = 0; i < shuffledQuestions.length; i++) {
            const question = shuffledQuestions[i];
            const startTime = Date.now();
            
            await this.logger.test(`📝 Processing Question ${i+1}/20: ${question.category}`, {
                questionId: question.id,
                category: question.category,
                questionPreview: question.question.substring(0, 100) + '...'
            });
            
            console.log(chalk.cyan(`\n[${i+1}/20] ${question.category.replace('_', ' ')} Category`));
            console.log(chalk.yellow('Question:'), question.question);
            console.log(chalk.gray('\n🤖 Sending to Claude API...'));
            
            // Make real API call to Claude
            const aiResponse = await this.generateRealAIResponse(question);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            await this.logger.process('🤖 Generated AI response', {
                questionId: question.id,
                responseLength: aiResponse.length,
                responseTime: responseTime
            });
            
            // Evaluate response
            const evaluation = this.evaluateResponse(aiResponse, question.correctAnswer, responseTime);
            const totalPoints = evaluation.accuracyScore + evaluation.timeScore;
            totalScore += totalPoints;
            
            await this.logger.logPerformanceMetric(`Question_${i+1}_Score`, totalPoints, '/12', `${question.category} - ${evaluation.accuracyScore} accuracy + ${evaluation.timeScore} speed`);
            await this.logger.logPerformanceMetric(`Question_${i+1}_ResponseTime`, responseTime, 'ms', question.category);
            
            // Track category scores
            if (!categoryScores[question.category]) {
                categoryScores[question.category] = { score: 0, total: 0, count: 0 };
            }
            categoryScores[question.category].score += totalPoints;
            categoryScores[question.category].total += 12;
            categoryScores[question.category].count++;
            
            console.log(chalk.white(`Response Time: ${responseTime}ms`));
            console.log(chalk.green(`Score: ${totalPoints}/12 (${evaluation.accuracyScore} accuracy + ${evaluation.timeScore} speed)`));
            
            const result = {
                timestamp: new Date().toISOString(),
                testId: question.id,
                category: question.category,
                question: question.question.substring(0, 200),
                aiResponse: aiResponse.substring(0, 300),
                correctAnswer: question.correctAnswer.substring(0, 300),
                accuracyScore: evaluation.accuracyScore,
                timeScore: evaluation.timeScore,
                totalScore: totalPoints,
                responseTimeMs: responseTime
            };
            
            results.push(result);
            await this.logger.success(`✅ Question ${i+1} completed | Score: ${totalPoints}/12 | Time: ${responseTime}ms`);
        }

        // Calculate final performance
        const finalPercentage = (totalScore / 240) * 100;
        
        await this.logger.logPerformanceMetric('Final_Score_Percentage', finalPercentage, '%', 'Overall benchmark performance');
        await this.logger.logPerformanceMetric('Final_Score_Points', totalScore, '/240', 'Total points achieved');
        
        console.log(chalk.green.bold('\n🏆 BENCHMARK TEST RESULTS'));
        console.log(chalk.green('=========================='));
        console.log(chalk.yellow.bold(`Final Score: ${finalPercentage.toFixed(1)}% (${totalScore}/240 points)`));
        
        // Category breakdown
        console.log(chalk.blue('\n📊 Category Performance:'));
        const categoryResults = {};
        Object.entries(categoryScores).forEach(([category, stats]) => {
            const percentage = (stats.score / stats.total) * 100;
            const categoryName = category.replace('_', ' ');
            categoryResults[category] = { percentage, score: stats.score, total: stats.total };
            console.log(chalk.white(`  ${categoryName}: ${percentage.toFixed(1)}% (${stats.score}/${stats.total})`));
            
            // Log individual category performance
            this.logger.logPerformanceMetric(`Category_${category}`, percentage, '%', `${stats.score}/${stats.total} points`);
        });
        
        // Performance grade
        let grade, gradeMessage;
        console.log(chalk.blue('\n🎯 Performance Assessment:'));
        if (finalPercentage >= 90) {
            grade = 'EXCELLENT';
            gradeMessage = 'Outstanding AI performance across all domains';
            console.log(chalk.green('🌟 EXCELLENT - Outstanding AI performance across all domains'));
        } else if (finalPercentage >= 80) {
            grade = 'VERY_GOOD';
            gradeMessage = 'Strong performance with minor improvement areas';
            console.log(chalk.cyan('⭐ VERY GOOD - Strong performance with minor improvement areas'));
        } else if (finalPercentage >= 70) {
            grade = 'GOOD';
            gradeMessage = 'Solid baseline with some gaps to address';
            console.log(chalk.yellow('✨ GOOD - Solid baseline with some gaps to address'));
        } else if (finalPercentage >= 60) {
            grade = 'FAIR';
            gradeMessage = 'Needs focused improvement in several areas';
            console.log(chalk.yellow('⚡ FAIR - Needs focused improvement in several areas'));
        } else {
            grade = 'NEEDS_IMPROVEMENT';
            gradeMessage = 'Significant gaps requiring attention';
            console.log(chalk.red('⚠️  NEEDS IMPROVEMENT - Significant gaps requiring attention'));
        }
        
        await this.logger.success(`🎯 Performance Grade: ${grade} - ${gradeMessage}`);
        
        // Log results to CSV
        try {
            await this.logger.logProcessStep('Save Results to CSV', 'STARTED');
            await this.csvWriter.writeRecords(results);
            await this.logger.logFileOperation('WRITE', this.benchmarkResultsPath, true, {
                recordCount: results.length,
                finalScore: finalPercentage,
                grade: grade
            });
            await this.logger.logProcessStep('Save Results to CSV', 'COMPLETED');
            console.log(chalk.green(`\n✅ Results saved to ${this.benchmarkResultsPath}`));
        } catch (error) {
            await this.logger.logProcessStep('Save Results to CSV', 'FAILED', { error: error.message });
            await this.logger.error('Failed to save results to CSV', { error: error.message, stack: error.stack });
        }
        
        // Log test completion
        await this.logger.logTestEnd('AI Performance Benchmark Test', {
            finalPercentage,
            totalScore,
            grade,
            totalQuestions: results.length,
            categoryBreakdown: categoryResults
        });
        
        // Create a snapshot of this test run
        await this.logger.createLogSnapshot(`benchmark-test-${Date.now()}`);
        
        return { finalPercentage, totalScore, results, categoryScores };
    }

    async generateRealAIResponse(question) {
        try {
            await this.logger.debug(`🤖 Sending question to Claude: ${question.id}`);
            
            const response = await this.anthropic.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `You are a technical expert being tested on programming knowledge. Please provide a concise, accurate answer to this question:

${question.question}

Provide a direct, technical response without unnecessary explanation. Focus on the core solution or answer.`
                }]
            });

            const aiResponse = response.content[0].text;
            await this.logger.debug(`✅ Received Claude response: ${aiResponse.length} characters`);
            return aiResponse;
            
        } catch (error) {
            await this.logger.error('Failed to get AI response', { 
                error: error.message, 
                questionId: question.id,
                stack: error.stack 
            });
            
            // Return error indicator instead of crashing
            return `[API Error: ${error.message}]`;
        }
    }

    evaluateResponse(aiResponse, correctAnswer, responseTime) {
        // Accuracy scoring (0-10 points)
        const accuracyScore = this.calculateAccuracyScore(aiResponse, correctAnswer);
        
        // Time bonus scoring (0-2 points)
        let timeScore = 0;
        if (responseTime < 2000) timeScore = 2;        // Under 2s = 2 points
        else if (responseTime < 4000) timeScore = 1;   // Under 4s = 1 point
        // Over 4s = 0 points
        
        return { accuracyScore, timeScore };
    }

    calculateAccuracyScore(aiResponse, correctAnswer) {
        const aiWords = aiResponse.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const correctWords = correctAnswer.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        
        // Calculate concept overlap
        let matches = 0;
        const totalConcepts = correctWords.length;
        
        correctWords.forEach(correctWord => {
            if (aiWords.some(aiWord => 
                aiWord.includes(correctWord) || 
                correctWord.includes(aiWord) ||
                this.areSynonyms(aiWord, correctWord)
            )) {
                matches++;
            }
        });
        
        const accuracy = totalConcepts > 0 ? (matches / totalConcepts) : 0;
        return Math.round(accuracy * 10);
    }

    areSynonyms(word1, word2) {
        const synonymGroups = [
            ['function', 'method', 'procedure'],
            ['variable', 'parameter', 'argument'],
            ['array', 'list', 'collection'],
            ['object', 'instance', 'entity'],
            ['database', 'table', 'relation'],
            ['query', 'select', 'search'],
            ['error', 'exception', 'bug'],
            ['algorithm', 'solution', 'approach']
        ];
        
        return synonymGroups.some(group => 
            group.includes(word1) && group.includes(word2)
        );
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        // Default to benchmark test
        const args = process.argv.slice(2);
        
        if (args.includes('--help') || args.includes('-h')) {
            this.showHelp();
            return;
        }
        
        // Run benchmark test (default behavior)
        await this.runBenchmarkTest();
    }

    showHelp() {
        console.log(chalk.blue.bold('\n🤖 AI Performance Monitor'));
        console.log(chalk.blue('========================='));
        console.log(chalk.white('Default: Runs 20-question benchmark test'));
        console.log(chalk.gray('\nUsage:'));
        console.log(chalk.white('  node ai-monitor.js          # Run benchmark test (default)'));
        console.log(chalk.white('  node ai-monitor.js --help   # Show this help'));
        console.log(chalk.gray('\nThe benchmark test includes:'));
        console.log(chalk.white('  • 4 SQL Database questions'));
        console.log(chalk.white('  • 4 Bug Identification questions'));
        console.log(chalk.white('  • 4 Code Completion questions'));
        console.log(chalk.white('  • 4 Logic/Algorithm questions'));
        console.log(chalk.white('  • 4 API Integration questions'));
        console.log(chalk.white('  • Scoring: 10 accuracy + 2 speed bonus per question'));
        console.log(chalk.white('  • Results saved to benchmark_results.csv\n'));
    }
}

// Run the monitor
if (require.main === module) {
    const monitor = new AIPerformanceMonitor();
    monitor.run().catch(console.error);
}

module.exports = AIPerformanceMonitor;
