const fs = require('fs-extra');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const chalk = require('chalk');
const Logger = require('./logger');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class AutomatedAITester {
    constructor() {
        this.logger = new Logger('Auto-Tester');
        this.testResultsPath = path.join(__dirname, 'automated_ai_test_results.csv');
        
        // Initialize Anthropic client for real AI calls
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        this.initializeResultsFile();
    }

    async initializeResultsFile() {
        try {
            await this.logger.logProcessStep('Initialize Automated Test Results File', 'STARTED');
            
            const csvWriter = createCsvWriter({
                path: this.testResultsPath,
                header: [
                    { id: 'timestamp', title: 'Timestamp' },
                    { id: 'testId', title: 'Test_ID' },
                    { id: 'category', title: 'Category' },
                    { id: 'question', title: 'Question' },
                    { id: 'myResponse', title: 'AI_Response' },
                    { id: 'correctAnswer', title: 'Correct_Answer' },
                    { id: 'score', title: 'Score' },
                    { id: 'reasoning', title: 'Evaluation_Reasoning' }
                ],
                append: true
            });
            this.csvWriter = csvWriter;

            if (!await fs.pathExists(this.testResultsPath)) {
                await this.csvWriter.writeRecords([]);
                await this.logger.logFileOperation('CREATE', this.testResultsPath, true, { type: 'CSV', purpose: 'automated_test_results' });
                await this.logger.success('Created automated test results file');
            } else {
                await this.logger.info('Automated test results file already exists');
            }
            
            await this.logger.logProcessStep('Initialize Automated Test Results File', 'COMPLETED');
        } catch (error) {
            await this.logger.logProcessStep('Initialize Automated Test Results File', 'FAILED', { error: error.message });
            await this.logger.error('Error initializing results file', { error: error.message, stack: error.stack });
        }
    }

    getTestQuestions() {
        return [
            {
                id: 'logic_puzzle',
                category: 'Logic_Reasoning',
                question: "In a 5-story building, Alice lives 2 floors above Bob, who lives 3 floors below Carol. Dan lives on floor 3. If Carol doesn't live on floor 5, what floor does Alice live on?",
                correctAnswer: "This puzzle contains a logical contradiction and has no valid solution."
            },
            {
                id: 'bayes_theorem',
                category: 'Statistical_Reasoning',
                question: "A medical test is 95% accurate. 1% of population has the disease. If you test positive, what's the probability you actually have the disease?",
                correctAnswer: "16.1%. Using Bayes' theorem: P(Disease|Positive) ≈ 0.161 = 16.1%"
            },
            {
                id: 'python_gotcha',
                category: 'Programming_Edge_Cases',
                question: "What's the output of this Python code?\nclass Counter:\n    def increment(self, step=[]):\n        step.append(1)\n        return len(step)",
                correctAnswer: "Output: 1, 2, 3. The mutable default argument [] is shared between all instances."
            },
            {
                id: 'logical_fallacy',
                category: 'Logic_Reasoning',
                question: "What's wrong with: 'All successful programmers work long hours. Sarah works long hours. Therefore, Sarah is a successful programmer.'?",
                correctAnswer: "This is the logical fallacy of 'affirming the consequent.' Invalid reasoning structure."
            },
            {
                id: 'integer_overflow',
                category: 'Programming_Edge_Cases',
                question: "What happens with this C code?\nint x = 2147483647;\nx = x + 1;\nprintf(\"%d\", x);",
                correctAnswer: "Integer overflow occurs. Typically wraps to -2147483648 on two's complement systems."
            }
        ];
    }

    async generateRealAIResponse(question) {
        try {
            await this.logger.debug(`🤖 Sending cognitive question to Claude: ${question.id}`);
            
            const response = await this.anthropic.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 800,
                messages: [{
                    role: "user",
                    content: `You are being tested on advanced reasoning and programming knowledge. Please provide a precise, analytical answer to this question:

${question.question}

Provide a thorough but concise response that demonstrates your reasoning process.`
                }]
            });

            const aiResponse = response.content[0].text;
            await this.logger.debug(`✅ Received Claude cognitive response: ${aiResponse.length} characters`);
            return aiResponse;
            
        } catch (error) {
            await this.logger.error('Failed to get AI cognitive response', { 
                error: error.message, 
                questionId: question.id,
                stack: error.stack 
            });
            
            // Return error indicator instead of crashing
            return `[API Error: ${error.message}]`;
        }
    }

    evaluateResponse(myResponse, correctAnswer) {
        const myWords = myResponse.toLowerCase().split(/\s+/);
        const correctWords = correctAnswer.toLowerCase().split(/\s+/);
        
        const keyCorrectWords = correctWords.filter(word => word.length > 3);
        const keyMyWords = myWords.filter(word => word.length > 3);
        
        let matches = 0;
        for (const correctWord of keyCorrectWords) {
            if (keyMyWords.some(myWord => 
                myWord.includes(correctWord) || 
                correctWord.includes(myWord) ||
                this.areRelated(myWord, correctWord)
            )) {
                matches++;
            }
        }
        
        const accuracy = keyCorrectWords.length > 0 ? (matches / keyCorrectWords.length) * 100 : 0;
        
        let score, reasoning;
        if (accuracy >= 80) {
            score = 10;
            reasoning = "Excellent - captures all key concepts accurately";
        } else if (accuracy >= 65) {
            score = 8;
            reasoning = "Very good - covers most important points";
        } else if (accuracy >= 50) {
            score = 6;
            reasoning = "Good - gets main idea with some gaps";
        } else if (accuracy >= 35) {
            score = 4;
            reasoning = "Partial understanding present";
        } else {
            score = 2;
            reasoning = "Limited understanding, significant gaps";
        }
        
        return { score, reasoning, accuracy: accuracy.toFixed(1) };
    }

    areRelated(word1, word2) {
        const synonyms = {
            'contradiction': ['impossible', 'invalid', 'paradox', 'conflict'],
            'probability': ['chance', 'likelihood', 'bayes'],
            'overflow': ['exceed', 'maximum', 'limit', 'wrap'],
            'fallacy': ['error', 'invalid', 'wrong', 'logical'],
            'mutable': ['shared', 'default', 'argument']
        };
        
        for (const [key, values] of Object.entries(synonyms)) {
            if ((key === word1 && values.includes(word2)) || 
                (key === word2 && values.includes(word1))) {
                return true;
            }
        }
        return false;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runAutomatedTest() {
        await this.logger.logTestStart('Automated AI Cognitive Testing System', this.getTestQuestions().length);
        await this.logger.info('🤖 AUTOMATED AI COGNITIVE TESTING START');
        await this.logger.info('Test Configuration', {
            testType: 'Cognitive Assessment',
            categories: ['Logic_Reasoning', 'Statistical_Reasoning', 'Programming_Edge_Cases'],
            maxScorePerQuestion: 10
        });

        console.log(chalk.blue('\n🤖 AUTOMATED AI COGNITIVE TESTING SYSTEM'));
        console.log(chalk.blue('=========================================='));
        console.log(chalk.white('Running comprehensive automated self-assessment...'));
        console.log(chalk.gray('Testing logical reasoning, statistical understanding, and edge cases\n'));

        const testQuestions = this.getTestQuestions();
        const results = [];
        let totalScore = 0;
        
        for (let i = 0; i < testQuestions.length; i++) {
            const test = testQuestions[i];
            
            await this.logger.test(`🧠 Processing Cognitive Test ${i+1}/${testQuestions.length}: ${test.category}`, {
                testId: test.id,
                category: test.category,
                questionPreview: test.question.substring(0, 100) + '...'
            });
            
            console.log(chalk.cyan(`[${i+1}/${testQuestions.length}] Testing: ${test.category}`));
            console.log(chalk.yellow('Question:'), test.question.substring(0, 80) + '...');
            console.log(chalk.gray('🤖 Sending to Claude API...'));
            
            // Get real AI response
            const aiResponse = await this.generateRealAIResponse(test);
            
            const evaluation = this.evaluateResponse(aiResponse, test.correctAnswer);
            totalScore += evaluation.score;
            
            await this.logger.logPerformanceMetric(`CognitiveTest_${i+1}_Score`, evaluation.score, '/10', `${test.category} - ${evaluation.reasoning}`);
            await this.logger.logPerformanceMetric(`CognitiveTest_${i+1}_Accuracy`, evaluation.accuracy, '%', test.category);
            
            console.log(chalk.white(`Score: ${evaluation.score}/10 - ${evaluation.reasoning}`));
            
            const result = {
                timestamp: new Date().toISOString(),
                testId: test.id,
                category: test.category,
                question: test.question.substring(0, 150),
                myResponse: aiResponse.substring(0, 200),
                correctAnswer: test.correctAnswer.substring(0, 150),
                score: evaluation.score,
                reasoning: evaluation.reasoning
            };
            
            results.push(result);
            await this.logger.success(`✅ Cognitive Test ${i+1} completed | Score: ${evaluation.score}/10 | Accuracy: ${evaluation.accuracy}%`);
        }
        
        const finalScore = (totalScore / (testQuestions.length * 10)) * 100;
        
        await this.logger.logPerformanceMetric('Cognitive_Final_Score_Percentage', finalScore, '%', 'Overall cognitive test performance');
        await this.logger.logPerformanceMetric('Cognitive_Final_Score_Points', totalScore, `/${testQuestions.length * 10}`, 'Total cognitive points achieved');
        
        console.log(chalk.green('\n📊 AUTOMATED TEST RESULTS'));
        console.log(chalk.green('==========================='));
        console.log(chalk.yellow(`🏆 Overall Performance: ${finalScore.toFixed(1)}%`));
        console.log(chalk.white(`Total Score: ${totalScore}/${testQuestions.length * 10}`));
        
        // Category breakdown
        const categoryStats = {};
        results.forEach(r => {
            if (!categoryStats[r.category]) {
                categoryStats[r.category] = { total: 0, count: 0 };
            }
            categoryStats[r.category].total += r.score;
            categoryStats[r.category].count++;
        });
        
        console.log(chalk.blue('\n📋 Performance by Category:'));
        const categoryResults = {};
        Object.entries(categoryStats).forEach(([category, stats]) => {
            const avg = (stats.total / stats.count).toFixed(1);
            categoryResults[category] = { average: avg, total: stats.total, count: stats.count };
            console.log(chalk.white(`  ${category.replace('_', ' ')}: ${avg}/10`));
            
            // Log individual category performance
            this.logger.logPerformanceMetric(`Cognitive_Category_${category}`, avg, '/10', `Average score for ${category}`);
        });
        
        // Log results to CSV
        try {
            await this.logger.logProcessStep('Save Cognitive Test Results to CSV', 'STARTED');
            await this.csvWriter.writeRecords(results);
            await this.logger.logFileOperation('WRITE', this.testResultsPath, true, {
                recordCount: results.length,
                finalScore: finalScore,
                testType: 'cognitive_assessment'
            });
            await this.logger.logProcessStep('Save Cognitive Test Results to CSV', 'COMPLETED');
            console.log(chalk.green('\n✅ Results logged to automated_ai_test_results.csv'));
        } catch (error) {
            await this.logger.logProcessStep('Save Cognitive Test Results to CSV', 'FAILED', { error: error.message });
            await this.logger.error('Error logging cognitive test results', { error: error.message, stack: error.stack });
            console.log(chalk.red('\n❌ Error logging results:', error.message));
        }
        
        // Performance assessment
        let cognitiveGrade, cognitiveMessage;
        console.log(chalk.blue('\n🔍 COGNITIVE ASSESSMENT:'));
        if (finalScore >= 90) {
            cognitiveGrade = 'EXCELLENT';
            cognitiveMessage = 'Strong reasoning across all domains';
            console.log(chalk.green('🌟 Excellent cognitive performance - Strong reasoning across all domains'));
        } else if (finalScore >= 80) {
            cognitiveGrade = 'VERY_GOOD';
            cognitiveMessage = 'Minor areas for improvement';
            console.log(chalk.cyan('✨ Very good performance - Minor areas for improvement'));
        } else if (finalScore >= 70) {
            cognitiveGrade = 'GOOD';
            cognitiveMessage = 'Some reasoning gaps detected';
            console.log(chalk.yellow('⚡ Good baseline - Some reasoning gaps detected'));
        } else {
            cognitiveGrade = 'NEEDS_IMPROVEMENT';
            cognitiveMessage = 'Recommend focused training';
            console.log(chalk.red('⚠️  Significant cognitive gaps - Recommend focused training'));
        }
        
        await this.logger.success(`🧠 Cognitive Assessment Grade: ${cognitiveGrade} - ${cognitiveMessage}`);
        
        // Log test completion
        await this.logger.logTestEnd('Automated AI Cognitive Testing System', {
            finalPercentage: finalScore,
            totalScore,
            cognitiveGrade,
            totalQuestions: results.length,
            categoryBreakdown: categoryResults
        });
        
        // Create a snapshot of this test run
        await this.logger.createLogSnapshot(`cognitive-test-${Date.now()}`);
        
        console.log(chalk.gray('\nTest completed automatically with zero user input required! 🎯'));
        
        return { 
            finalPercentage: finalScore, 
            totalScore, 
            results, 
            categoryResults,
            cognitiveGrade,
            cognitiveMessage 
        };
    }
}

// Auto-run when executed directly
if (require.main === module) {
    const tester = new AutomatedAITester();
    tester.runAutomatedTest().catch(console.error);
}

module.exports = AutomatedAITester; 