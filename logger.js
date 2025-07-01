const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor(module_name = 'AI-Performance', options = {}) {
        this.moduleName = module_name;
        this.logsDir = path.join(__dirname, 'Logs');
        this.options = {
            logToFile: true,
            logToConsole: true,
            timestampFormat: 'full', // 'full', 'time', 'none'
            rotateDaily: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            ...options
        };
        
        this.initializeLogsDirectory();
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();
        
        // Log level configurations with emojis
        this.logLevels = {
            SYSTEM: { emoji: '🖥️', color: chalk.magenta, priority: 0 },
            INFO: { emoji: 'ℹ️', color: chalk.blue, priority: 1 },
            SUCCESS: { emoji: '✅', color: chalk.green, priority: 2 },
            WARNING: { emoji: '⚠️', color: chalk.yellow, priority: 3 },
            ERROR: { emoji: '❌', color: chalk.red, priority: 4 },
            DEBUG: { emoji: '🔍', color: chalk.gray, priority: 5 },
            PERFORMANCE: { emoji: '⚡', color: chalk.cyan, priority: 6 },
            TEST: { emoji: '🧪', color: chalk.magenta, priority: 7 },
            DATABASE: { emoji: '🗄️', color: chalk.blue, priority: 8 },
            API: { emoji: '🌐', color: chalk.green, priority: 9 },
            FILE: { emoji: '📁', color: chalk.yellow, priority: 10 },
            PROCESS: { emoji: '⚙️', color: chalk.cyan, priority: 11 }
        };
        
        this.logSession();
    }

    async initializeLogsDirectory() {
        try {
            await fs.ensureDir(this.logsDir);
            
            // Create subdirectories for different types of logs
            const subDirs = ['daily', 'errors', 'performance', 'tests', 'debug'];
            for (const dir of subDirs) {
                await fs.ensureDir(path.join(this.logsDir, dir));
            }
        } catch (error) {
            console.error('Failed to initialize logs directory:', error);
        }
    }

    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getTimestamp() {
        const now = new Date();
        switch (this.options.timestampFormat) {
            case 'full':
                return now.toISOString();
            case 'time':
                return now.toTimeString().split(' ')[0];
            case 'none':
                return '';
            default:
                return now.toISOString();
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const levelConfig = this.logLevels[level] || this.logLevels.INFO;
        const emoji = levelConfig.emoji;
        
        let formattedMessage = '';
        if (timestamp) {
            formattedMessage += `[${timestamp}] `;
        }
        formattedMessage += `${emoji} [${level}][${this.moduleName}] ${message}`;
        
        if (data) {
            formattedMessage += ` | Data: ${JSON.stringify(data, null, 2)}`;
        }
        
        return { formatted: formattedMessage, raw: { timestamp, level, module: this.moduleName, message, data } };
    }

    async writeToFile(level, formattedMessage, rawData) {
        if (!this.options.logToFile) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFileName = `${this.moduleName.toLowerCase()}-${today}.log`;
            const logFilePath = path.join(this.logsDir, 'daily', logFileName);
            
            const logEntry = `${formattedMessage}\n`;
            await fs.appendFile(logFilePath, logEntry);
            
            // Write to specific log files based on level
            if (level === 'ERROR') {
                const errorLogPath = path.join(this.logsDir, 'errors', `errors-${today}.log`);
                await fs.appendFile(errorLogPath, logEntry);
            } else if (level === 'PERFORMANCE') {
                const perfLogPath = path.join(this.logsDir, 'performance', `performance-${today}.log`);
                await fs.appendFile(perfLogPath, logEntry);
            } else if (level === 'TEST') {
                const testLogPath = path.join(this.logsDir, 'tests', `tests-${today}.log`);
                await fs.appendFile(testLogPath, logEntry);
            } else if (level === 'DEBUG') {
                const debugLogPath = path.join(this.logsDir, 'debug', `debug-${today}.log`);
                await fs.appendFile(debugLogPath, logEntry);
            }
            
            // Also write structured JSON log for easier parsing
            const jsonLogPath = path.join(this.logsDir, 'daily', `${this.moduleName.toLowerCase()}-${today}.json`);
            const jsonEntry = JSON.stringify({ ...rawData, sessionId: this.sessionId }) + '\n';
            await fs.appendFile(jsonLogPath, jsonEntry);
            
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    async log(level, message, data = null) {
        const { formatted, raw } = this.formatMessage(level, message, data);
        
        // Console output with colors
        if (this.options.logToConsole) {
            const levelConfig = this.logLevels[level] || this.logLevels.INFO;
            console.log(levelConfig.color(formatted));
        }
        
        // File output
        await this.writeToFile(level, formatted, raw);
    }

    // Convenience methods for different log levels
    async system(message, data = null) { await this.log('SYSTEM', message, data); }
    async info(message, data = null) { await this.log('INFO', message, data); }
    async success(message, data = null) { await this.log('SUCCESS', message, data); }
    async warning(message, data = null) { await this.log('WARNING', message, data); }
    async error(message, data = null) { await this.log('ERROR', message, data); }
    async debug(message, data = null) { await this.log('DEBUG', message, data); }
    async performance(message, data = null) { await this.log('PERFORMANCE', message, data); }
    async test(message, data = null) { await this.log('TEST', message, data); }
    async database(message, data = null) { await this.log('DATABASE', message, data); }
    async api(message, data = null) { await this.log('API', message, data); }
    async file(message, data = null) { await this.log('FILE', message, data); }
    async process(message, data = null) { await this.log('PROCESS', message, data); }

    // Special logging methods for specific scenarios
    async logTestStart(testName, testCount = null) {
        const message = testCount ? 
            `Starting test suite: ${testName} (${testCount} tests)` :
            `Starting test: ${testName}`;
        await this.test(`🚀 ${message}`);
    }

    async logTestEnd(testName, results = null) {
        const message = results ? 
            `Completed test: ${testName} | Results: ${JSON.stringify(results)}` :
            `Completed test: ${testName}`;
        await this.test(`🏁 ${message}`);
    }

    async logPerformanceMetric(metric, value, unit = '', context = '') {
        const message = `${metric}: ${value}${unit}${context ? ` (${context})` : ''}`;
        await this.performance(`📊 ${message}`, { metric, value, unit, context });
    }

    async logFileOperation(operation, filePath, success = true, details = null) {
        const emoji = success ? '📝' : '📛';
        const status = success ? 'SUCCESS' : 'FAILED';
        const message = `${emoji} File ${operation} ${status}: ${filePath}`;
        
        if (success) {
            await this.file(message, details);
        } else {
            await this.error(message, details);
        }
    }

    async logAPICall(method, endpoint, status, responseTime = null, details = null) {
        const emoji = status >= 200 && status < 300 ? '🌟' : status >= 400 ? '🚨' : '⚡';
        const message = `${emoji} API ${method} ${endpoint} | Status: ${status}${responseTime ? ` | ${responseTime}ms` : ''}`;
        await this.api(message, { method, endpoint, status, responseTime, details });
    }

    async logDatabaseOperation(operation, table = '', recordCount = null, duration = null) {
        const emoji = '🗃️';
        let message = `${emoji} Database ${operation}`;
        if (table) message += ` on ${table}`;
        if (recordCount !== null) message += ` | Records: ${recordCount}`;
        if (duration !== null) message += ` | Duration: ${duration}ms`;
        
        await this.database(message, { operation, table, recordCount, duration });
    }

    async logProcessStep(step, status = 'STARTED', details = null) {
        const emoji = status === 'STARTED' ? '▶️' : status === 'COMPLETED' ? '✔️' : status === 'FAILED' ? '❌' : '⏸️';
        const message = `${emoji} Process Step: ${step} | Status: ${status}`;
        await this.process(message, { step, status, details });
    }

    // Session and summary methods
    async logSession() {
        await this.system(`🎯 New session started | Session ID: ${this.sessionId} | Module: ${this.moduleName}`);
    }

    async logSessionEnd(summary = null) {
        const duration = new Date() - this.startTime;
        const durationStr = `${Math.round(duration / 1000)}s`;
        await this.system(`🎬 Session ended | Duration: ${durationStr} | Session ID: ${this.sessionId}`, summary);
    }

    async logSummary(title, data) {
        await this.info(`📋 ${title}`, data);
    }

    // Utility methods
    async createLogSnapshot(name) {
        const snapshotData = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            moduleName: this.moduleName,
            uptime: new Date() - this.startTime,
            name
        };
        
        const snapshotPath = path.join(this.logsDir, `snapshot-${name}-${Date.now()}.json`);
        await fs.writeJson(snapshotPath, snapshotData, { spaces: 2 });
        await this.info(`📸 Log snapshot created: ${name}`, { path: snapshotPath });
    }

    async getLogStats() {
        try {
            const dailyDir = path.join(this.logsDir, 'daily');
            const files = await fs.readdir(dailyDir);
            const logFiles = files.filter(f => f.endsWith('.log'));
            
            const stats = {
                totalLogFiles: logFiles.length,
                logDirectory: this.logsDir,
                sessionId: this.sessionId,
                uptime: new Date() - this.startTime
            };
            
            return stats;
        } catch (error) {
            await this.error('Failed to get log stats', { error: error.message });
            return null;
        }
    }
}

module.exports = Logger; 