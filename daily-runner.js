const fs = require('fs-extra');
const path = require('path');
const Logger = require('./logger');
const chalk = require('chalk');
const AIPerformanceMonitor = require('./ai-monitor');
const AutomatedAITester = require('./auto-test');

class DailyPerformanceRunner {
    constructor() {
        this.logger = new Logger('Daily-Runner');
        this.resultsLogPath = path.join(__dirname, 'daily-results.log');
        this.reportsDir = path.join(__dirname, 'Reports');
        this.today = new Date().toISOString().split('T')[0];
    }

    async run() {
        const startTime = Date.now();
        
        await this.logger.info('🌅 Starting Daily AI Performance Check');
        console.log(chalk.blue.bold('\n🌅 DAILY AI PERFORMANCE AUTOMATION'));
        console.log(chalk.blue('===================================='));
        console.log(chalk.white(`Date: ${this.today}`));
        console.log(chalk.gray(`Started at: ${new Date().toLocaleTimeString()}\n`));

        try {
            await fs.ensureDir(this.reportsDir);
            
            // Clear module cache to ensure completely fresh instances
            await this.clearModuleCache();
            
            // Run REAL AI Performance Tests with fresh module instances
            console.log(chalk.cyan('🔥 Running AI Benchmark Test...'));
            const FreshAIMonitor = require('./ai-monitor');
            const aiMonitor = new FreshAIMonitor();
            const benchmarkResults = await aiMonitor.runBenchmarkTest();
            
            console.log(chalk.cyan('\n🧠 Running Cognitive Test...'));
            const FreshAITester = require('./auto-test');
            const cognitiveTest = new FreshAITester();
            const cognitiveResults = await cognitiveTest.runAutomatedTest();
            
            // Calculate combined score (70% benchmark, 30% cognitive)
            const benchmarkScore = benchmarkResults.finalPercentage;
            const cognitiveScore = cognitiveResults.finalPercentage;
            const overallScore = (benchmarkScore * 0.7) + (cognitiveScore * 0.3);
            
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            
            await this.logger.success(`🎯 Combined AI Performance: ${overallScore.toFixed(1)}%`);
            await this.logger.info('Test Breakdown', {
                benchmarkScore: benchmarkScore.toFixed(1) + '%',
                cognitiveScore: cognitiveScore.toFixed(1) + '%',
                weighting: '70% benchmark + 30% cognitive',
                totalQuestions: benchmarkResults.results.length + (cognitiveResults.results?.length || 10)
            });
            
            // Simple results log: Date [TAB] Result% [TAB] Time [TAB] Clock Time
            const clockTime = new Date().toLocaleTimeString();
            const logEntry = `${this.today}\t${overallScore.toFixed(1)}%\t${totalTime}s\t${clockTime}\n`;
            await fs.appendFile(this.resultsLogPath, logEntry);
            
            // Generate HTML dashboard
            await this.generateHTMLDashboard(overallScore);
            
            // Generate trend analysis
            await this.generateTrendAnalysis();
            
            // Export summaries
            await this.exportSummaryReports(overallScore, totalTime);
            
            console.log(chalk.green.bold('\n✅ DAILY PERFORMANCE CHECK COMPLETE!'));
            console.log(chalk.white(`📊 Overall Performance: ${overallScore}%`));
            console.log(chalk.white(`⏱️ Total Time: ${totalTime}s`));
            console.log(chalk.yellow(`📁 Reports saved to: ${this.reportsDir}`));
            console.log(chalk.yellow(`📋 Simple log: ${this.resultsLogPath}`));
            
            // Display all results in terminal
            await this.displayAllResults();
            
        } catch (error) {
            await this.logger.error('Daily performance check failed', { error: error.message });
            throw error;
        }
    }

    async generateHTMLDashboard(score) {
        const getColor = (s) => s >= 80 ? '#10B981' : '#F59E0B';
        const getGrade = (s) => s >= 90 ? 'EXCELLENT' : s >= 80 ? 'VERY GOOD' : 'GOOD';
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Performance Dashboard - ${this.today}</title>
    <style>
        body { 
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh;
        }
        .container { 
            max-width: 800px; margin: 0 auto; background: white; 
            border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #2D3748 0%, #4A5568 100%);
            color: white; padding: 30px; text-align: center; border-radius: 20px 20px 0 0;
        }
        .header h1 { font-size: 2.5rem; margin: 0 0 10px 0; }
        .dashboard { padding: 40px; }
        .score-card { 
            background: #f8f9fa; padding: 40px; border-radius: 15px; 
            text-align: center; margin-bottom: 30px;
            border-left: 5px solid ${getColor(score)};
        }
        .score-value { 
            font-size: 4rem; font-weight: bold; color: #2D3748; margin-bottom: 10px;
        }
        .score-label { font-size: 1.2rem; color: #718096; }
        .grade { 
            padding: 10px 20px; border-radius: 25px; 
            background: ${getColor(score)}; 
            color: white; display: inline-block; margin-top: 15px;
        }
        .timestamp { text-align: center; color: #718096; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Performance Dashboard</h1>
            <p>Daily Performance Report - ${this.today}</p>
        </div>
        <div class="dashboard">
            <div class="score-card">
                <div class="score-value">${score}%</div>
                <div class="score-label">Overall Performance</div>
                <div class="grade">${getGrade(score)}</div>
            </div>
            <div class="timestamp">Generated at ${new Date().toLocaleString()}</div>
        </div>
    </div>
</body>
</html>`;
        
        const htmlPath = path.join(this.reportsDir, `dashboard-${this.today}.html`);
        await fs.writeFile(htmlPath, html);
        await this.logger.success(`📊 HTML Dashboard generated: ${htmlPath}`);
    }

    async generateTrendAnalysis() {
        try {
            const historicalData = await this.readHistoricalResults();
            const trendData = this.analyzeTrends(historicalData);
            
            const trendPath = path.join(this.reportsDir, `trends-${this.today}.json`);
            await fs.writeJson(trendPath, trendData, { spaces: 2 });
            await this.logger.success(`📈 Trend analysis generated: ${trendPath}`);
        } catch (error) {
            await this.logger.error('Failed to generate trend analysis', { error: error.message });
        }
    }

    async readHistoricalResults() {
        try {
            if (!await fs.pathExists(this.resultsLogPath)) return [];
            
            const content = await fs.readFile(this.resultsLogPath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            return lines.map(line => {
                const parts = line.split('\t');
                const [date, score, time, clockTime] = parts;
                return { 
                    date, 
                    score: parseFloat(score.replace('%', '')), 
                    time,
                    clockTime: clockTime || 'N/A' // Handle old entries without clock time
                };
            });
        } catch (error) {
            return [];
        }
    }

    analyzeTrends(data) {
        if (data.length < 2) {
            return { 
                trend: 'insufficient_data', 
                average: data.length > 0 ? data[0].score : 0,
                dataPoints: data.length 
            };
        }

        const scores = data.map(d => d.score);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const improvement = scores[scores.length - 1] - scores[0];
        
        return {
            trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
            average: average.toFixed(1),
            improvement: improvement.toFixed(1),
            dataPoints: data.length,
            lastScore: scores[scores.length - 1],
            recommendations: this.getRecommendations(average, improvement)
        };
    }

    getRecommendations(average, improvement) {
        const recs = [];
        if (average < 70) recs.push('🎯 Focus on fundamental improvements');
        if (improvement < -5) recs.push('📉 Performance declining - investigate');
        if (improvement > 5) recs.push('📈 Great improvement trend!');
        if (average > 90) recs.push('🌟 Excellent performance!');
        return recs.length > 0 ? recs : ['📊 Performance tracking active'];
    }

    async exportSummaryReports(score, time) {
        try {
            // JSON Export
            const jsonData = {
                date: this.today,
                timestamp: new Date().toISOString(),
                overallScore: score,
                timeElapsed: `${time}s`,
                grade: score >= 90 ? 'EXCELLENT' : score >= 80 ? 'VERY GOOD' : 'GOOD'
            };
            
            const jsonPath = path.join(this.reportsDir, `summary-${this.today}.json`);
            await fs.writeJson(jsonPath, jsonData, { spaces: 2 });
            
            // CSV Export
            const csvData = `Date,Score,Time,Grade\n${this.today},${score}%,${time}s,${jsonData.grade}`;
            const csvPath = path.join(this.reportsDir, `summary-${this.today}.csv`);
            await fs.writeFile(csvPath, csvData);
            
            // Text Export
            const textData = `AI Performance Summary - ${this.today}
========================================
Score: ${score}%
Time: ${time}s
Grade: ${jsonData.grade}
Date: ${this.today}

Generated: ${new Date().toLocaleString()}`;
            
            const textPath = path.join(this.reportsDir, `summary-${this.today}.txt`);
            await fs.writeFile(textPath, textData);
            
            await this.logger.success(`📋 Summary reports exported: JSON, CSV, TXT`);
            
        } catch (error) {
            await this.logger.error('Failed to export summary reports', { error: error.message });
        }
    }

    async clearModuleCache() {
        // Clear Node.js require cache for test modules to ensure completely fresh runs
        const modulesToClear = [
            './ai-monitor',
            './auto-test'
        ];
        
        console.log(chalk.gray('🧹 Clearing module cache for fresh test runs...'));
        
        for (const moduleId of modulesToClear) {
            const fullPath = require.resolve(moduleId);
            if (require.cache[fullPath]) {
                delete require.cache[fullPath];
                await this.logger.debug(`Cleared cache for module: ${moduleId}`);
            }
        }
        
        // Force garbage collection if available (helps clear any lingering references)
        if (global.gc) {
            global.gc();
            await this.logger.debug('Forced garbage collection');
        }
        
        // Additional cache clearing to be thorough
        delete require.cache[require.resolve('./ai-monitor')];
        delete require.cache[require.resolve('./auto-test')];
        
        // Note: Module classes will be re-required fresh when instantiated
        
        await this.logger.success('✅ Module cache cleared - ensuring fresh test execution');
        console.log(chalk.green('✅ Cache cleared - ready for fresh test execution\n'));
    }

    async displayAllResults() {
        try {
            console.log(chalk.blue.bold('\n📊 ALL PERFORMANCE RESULTS'));
            console.log(chalk.blue('═'.repeat(80)));
            
            const historicalData = await this.readHistoricalResults();
            
            if (historicalData.length === 0) {
                console.log(chalk.yellow('No historical data found.'));
                return;
            }

            // Display header
            console.log(chalk.white.bold('Date\t\t\tScore\t\tDuration\tClock Time'));
            console.log(chalk.gray('─'.repeat(70)));
            
            // Display each result
            historicalData.forEach((result, index) => {
                const isLatest = index === historicalData.length - 1;
                const color = isLatest ? chalk.green : chalk.white;
                const indicator = isLatest ? '👉 ' : '   ';
                
                console.log(color(
                    `${indicator}${result.date}\t\t${result.score.toFixed(1)}%\t\t${result.time}\t\t${result.clockTime}`
                ));
            });
            
            // Display summary stats
            const scores = historicalData.map(d => d.score);
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            const latest = scores[scores.length - 1];
            const trend = latest > average ? '📈' : latest < average ? '📉' : '➡️';
            
            console.log(chalk.gray('─'.repeat(70)));
            console.log(chalk.cyan(`📊 Average: ${average.toFixed(1)}%`));
            console.log(chalk.cyan(`📈 Latest: ${latest.toFixed(1)}% ${trend}`));
            console.log(chalk.cyan(`📝 Total Runs: ${historicalData.length}`));
            
            console.log(chalk.blue('═'.repeat(80)));
            console.log(chalk.green('🎯 Latest result highlighted above'));
            
        } catch (error) {
            await this.logger.error('Failed to display results', { error: error.message });
        }
    }
}

// Auto-run when executed directly
if (require.main === module) {
    const runner = new DailyPerformanceRunner();
    runner.run().catch(error => {
        console.error(chalk.red('❌ Daily performance check failed:'), error);
        process.exit(1);
    });
}

module.exports = DailyPerformanceRunner; 