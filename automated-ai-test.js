const fs = require('fs-extra');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const chalk = require('chalk');
const Logger = require('./logger');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class AutomatedAITester {
    constructor() {
        this.logger = new Logger('Automated-AI-Tester');
        this.testResultsPath = path.join(__dirname, 'automated_ai_test_results.csv');
        
        // Initialize Anthropic client for real AI calls
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        this.initializeResultsFile();
    }

    async initializeResultsFile() {
        try {
            await this.logger.logProcessStep('Initialize Automated AI Test Results File', 'STARTED');
            
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
                await this.logger.logFileOperation('CREATE', this.testResultsPath, true, { type: 'CSV', purpose: 'automated_ai_test_results' });
                await this.logger.success('Created automated AI test results file');
            } else {
                await this.logger.info('Automated AI test results file already exists');
            }
            
            await this.logger.logProcessStep('Initialize Automated AI Test Results File', 'COMPLETED');
        } catch (error) {
            await this.logger.logProcessStep('Initialize Automated AI Test Results File', 'FAILED', { error: error.message });
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
            await this.logger.debug(`🤖 Sending cognitive test question to Claude: ${question.id}`);
            
            const response = await this.anthropic.messages.create({
                model: "claude-3-sonnet-20240229",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `You are taking a cognitive test. Please provide a concise, accurate answer to this question:

${question.question}

Provide a direct, technical response focusing on the core solution or answer. Think through the problem step by step if needed.`
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

    evaluateResponse(aiResponse, correctAnswer) {
        const aiWords = aiResponse.toLowerCase().split(/\s+/);
        const correctWords = correctAnswer.toLowerCase().split(/\s+/);
        
        const keyCorrectWords = correctWords.filter(word => word.length > 3);
        const keyAiWords = aiWords.filter(word => word.length > 3);
        
        let matches = 0;
        for (const correctWord of keyCorrectWords) {
            if (keyAiWords.some(aiWord => 
                aiWord.includes(correctWord) || 
                correctWord.includes(aiWord) ||
                this.areRelated(aiWord, correctWord)
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
        await this.logger.logTestStart('Automated AI Cognitive Testing System v3 (Real API)', this.getTestQuestions().length);
        await this.logger.info('🤖 AUTOMATED AI COGNITIVE TESTING START (v3 - Real API)');
        await this.logger.info('Test Configuration v3', {
            testType: 'Real-Time Cognitive Assessment',
            categories: ['Logic_Reasoning', 'Statistical_Reasoning', 'Programming_Edge_Cases'],
            maxScorePerQuestion: 10,
            version: '3.0 - Live API',
            apiModel: 'claude-3-sonnet-20240229'
        });

        console.log(chalk.blue('\n🤖 AUTOMATED AI COGNITIVE TESTING SYSTEM (Live API)'));
        console.log(chalk.blue('===================================================='));
        console.log(chalk.white('Running real-time cognitive assessment with live AI responses...'));
        console.log(chalk.gray('Testing logical reasoning, statistical understanding, and edge cases\n'));

        const testQuestions = this.getTestQuestions();
        const results = [];
        let totalScore = 0;
        
        for (let i = 0; i < testQuestions.length; i++) {
            const test = testQuestions[i];
            
            await this.logger.test(`🧠 Processing Real-Time Cognitive Test ${i+1}/${testQuestions.length}: ${test.category}`, {
                testId: test.id,
                category: test.category,
                questionPreview: test.question.substring(0, 100) + '...',
                version: '3.0 - Live API'
            });
            
            console.log(chalk.cyan(`[${i+1}/${testQuestions.length}] Testing: ${test.category}`));
            console.log(chalk.yellow('Question:'), test.question.substring(0, 80) + '...');
            
            // Generate real AI response
            const startTime = Date.now();
            const aiResponse = await this.generateRealAIResponse(test);
            const responseTime = Date.now() - startTime;
            
            await this.logger.debug(`⏱️ AI response time: ${responseTime}ms`);
            
            const evaluation = this.evaluateResponse(aiResponse, test.correctAnswer);
            totalScore += evaluation.score;
            
            await this.logger.logPerformanceMetric(`RealTimeCognitiveTest_${i+1}_Score`, evaluation.score, '/10', `${test.category} - ${evaluation.reasoning}`);
            await this.logger.logPerformanceMetric(`RealTimeCognitiveTest_${i+1}_Accuracy`, evaluation.accuracy, '%', `${test.category} v3.0 Live API`);
            await this.logger.logPerformanceMetric(`RealTimeCognitiveTest_${i+1}_ResponseTime`, responseTime, 'ms', `API Response Time`);
            
            console.log(chalk.white(`Score: ${evaluation.score}/10 - ${evaluation.reasoning}`));
            console.log(chalk.gray(`Response time: ${responseTime}ms`));
            
            const result = {
                timestamp: new Date().toISOString(),
                testId: test.id,
                category: test.category,
                question: test.question.substring(0, 150),
                myResponse: aiResponse.substring(0, 200), // Truncate for CSV
                correctAnswer: test.correctAnswer.substring(0, 150),
                score: evaluation.score,
                reasoning: evaluation.reasoning
            };
            
            results.push(result);
        }

        const finalPercentage = (totalScore / (testQuestions.length * 10)) * 100;
        const maxScore = testQuestions.length * 10;

        console.log(chalk.blue('\n📊 COGNITIVE TEST RESULTS (Live AI):'));
        console.log(chalk.white(`Total Score: ${totalScore}/${maxScore} (${finalPercentage.toFixed(1)}%)`));

        // Performance assessment
        let grade;
        if (finalPercentage >= 90) {
            grade = 'EXCELLENT';
            console.log(chalk.green('🌟 EXCELLENT - Outstanding cognitive performance'));
        } else if (finalPercentage >= 80) {
            grade = 'VERY_GOOD';
            console.log(chalk.cyan('⭐ VERY GOOD - Strong cognitive abilities'));
        } else if (finalPercentage >= 70) {
            grade = 'GOOD';
            console.log(chalk.yellow('✨ GOOD - Solid cognitive baseline'));
        } else {
            grade = 'NEEDS_IMPROVEMENT';
            console.log(chalk.red('⚠️  NEEDS IMPROVEMENT - Cognitive gaps identified'));
        }

        // Save results
        try {
            await this.csvWriter.writeRecords(results);
            await this.logger.success(`💾 Real-time test results saved to ${this.testResultsPath}`);
            console.log(chalk.green(`\n✅ Results saved to ${this.testResultsPath}`));
        } catch (error) {
            await this.logger.error('Failed to save results', { error: error.message });
        }

        await this.logger.logTestEnd('Real-Time Automated AI Cognitive Test', {
            finalPercentage,
            totalScore,
            grade,
            totalQuestions: results.length,
            version: '3.0 - Live API'
        });

        return { finalPercentage, totalScore, results };
    }
}

// Auto-run when executed directly
if (require.main === module) {
    const tester = new AutomatedAITester();
    tester.runAutomatedTest().catch(console.error);
}

module.exports = AutomatedAITester; 