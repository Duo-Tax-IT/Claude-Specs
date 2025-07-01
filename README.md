# AI Performance Monitoring System

A comprehensive Node.js tool to track AI assistant performance over time through standardized benchmark tests.

## 🚀 Quick Start

### Installation

1. **Clone or download** this project to your local machine
2. **Install dependencies**:
   ```bash
   npm install
   ```

### Daily Usage

Run a quick performance test:
```bash
npm start
```

Or directly:
```bash
node ai-monitor.js
```

## 📋 Features

### Benchmark Test Categories

The system includes **5 categories** of technical tests:

1. **SQL/Database** - Query modifications, JOINs, WHERE clauses
2. **Bug Identification** - Find issues in JavaScript, Python, SQL, CSS code
3. **Code Completion** - Complete partial functions and components
4. **Logic/Algorithm** - Time complexity, sorting algorithms, data structure problems
5. **API/Integration** - HTTP requests, status codes, error handling

### Performance Metrics

- **Response Time** - Precisely measured in seconds
- **Accuracy** - Automatic scoring (Correct/Partial/Incorrect)
- **Comprehensive Logging** - All results saved to CSV with timestamps
- **Trend Analysis** - View performance patterns over time

## 🎯 How to Use

### Running a Single Test

1. Start the application: `npm start`
2. Choose option **1** from the menu
3. A random test will be presented
4. Press Enter when ready to start timing
5. Give the test to your AI assistant
6. Enter the AI's response when received
7. The system automatically calculates accuracy and response time
8. Add optional notes if needed

### Example Test Flow

```
📋 AI PERFORMANCE TEST - Bug Identification
============================================================

Task:
Find the bug in this JavaScript function:
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i <= items.length; i++) {
        total += items[i].price;
    }
    return total;
}

Description: Identify array bounds bug in JavaScript loop
------------------------------------------------------------

⏰ Timer starts when you press Enter to begin...
Press Enter when ready to start timing: [ENTER]
🚀 Timer started! Give the AI this task and measure response time.

Enter the AI's response: The bug is using <= instead of < in the loop condition

📊 RESULTS:
Response Time: 8.45 seconds
Accuracy: Correct
```

### Viewing Performance Trends

Choose option **2** from the menu or run:
```bash
npm run trends
```

You'll see:
- Overall statistics (average response time, accuracy distribution)
- Performance breakdown by category
- Recent test results
- Trend analysis over time

## 📊 Data Export

All results are automatically saved to `ai_performance_log.csv` with columns:

| Column | Description |
|--------|-------------|
| Date | Test date |
| Time | Test time |
| Task_Type | Category (SQL_Database, Bug_Identification, etc.) |
| Task_Description | Brief description of the test |
| Response_Time_Seconds | Precise timing in seconds |
| Accuracy | Correct/Partial/Incorrect |
| AI_Response | The AI's actual response (truncated) |
| Notes | Optional user notes |

## 🔄 Daily Monitoring Workflow

### Recommended Daily Routine

1. **Same time each day** - Run tests at consistent times
2. **Single test** - One test per day for consistency
3. **Document context** - Note any unusual circumstances
4. **Review trends weekly** - Check for patterns or degradation

### Sample Schedule

```bash
# Morning routine
npm start  # Run single test

# Weekly analysis  
npm run trends  # Review performance patterns
```

## 📈 Performance Analysis

### Accuracy Scoring

- **Correct**: Exact match or contains all key concepts (80%+ match)
- **Partial**: Contains some relevant concepts (50-79% match)  
- **Incorrect**: Missing key concepts (<50% match)

### Trend Indicators

**Good Performance:**
- Consistent response times (±2 seconds)
- 80%+ accuracy rate
- Stable performance across categories

**Performance Concerns:**
- Increasing response times
- Declining accuracy trends
- Significant category-specific weaknesses

## 🛠 Customization

### Adding New Tests

Edit `ai-monitor.js` and add tests to the appropriate category in `initializeBenchmarkTests()`:

```javascript
'SQL_Database': [
    {
        question: "Your test question here",
        expectedAnswer: "Expected response",
        description: "Brief test description"
    }
    // ... add more tests
]
```

### Modifying Categories

You can add new categories or modify existing ones in the `benchmarkTests` object.

## 📋 Requirements

- **Node.js** (v12 or higher)
- **NPM** (for dependency management)
- **Terminal/Command prompt** access

## 🔧 Dependencies

- `csv-writer` - CSV file generation
- `csv-parser` - Reading CSV data for trends
- `readline-sync` - Interactive command-line input
- `fs-extra` - Enhanced file system operations
- `chalk` - Colored terminal output

## 📝 Example Output

### Performance Trends Report

```
📈 PERFORMANCE TRENDS ANALYSIS
==================================================

📊 Overall Statistics (15 tests):
Average Response Time: 12.34 seconds
Accuracy Distribution:
  Correct: 12 (80.0%)
  Partial: 2 (13.3%)
  Incorrect: 1 (6.7%)

📋 Performance by Category:
  SQL Database: 10.50s avg, 85.0% correct (4 tests)
  Bug Identification: 15.20s avg, 75.0% correct (4 tests)
  Code Completion: 8.90s avg, 90.0% correct (3 tests)
  Logic Algorithm: 14.10s avg, 66.7% correct (3 tests)
  API Integration: 11.80s avg, 100.0% correct (1 tests)

🕐 Recent Performance (Last 5 tests):
  1. SQL_Database: 9.50s, Correct
  2. Bug_Identification: 18.20s, Partial
  3. Code_Completion: 7.30s, Correct
  4. Logic_Algorithm: 16.40s, Incorrect
  5. API_Integration: 11.80s, Correct
```

## 🎯 Tips for Effective Monitoring

1. **Consistency** - Test at the same time daily
2. **Environment** - Use the same AI assistant and settings
3. **Documentation** - Note any changes in AI model or configuration
4. **Patience** - Trends become meaningful after 2+ weeks of data
5. **Context** - Consider external factors affecting performance

## 🚨 Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
npm install
```

**CSV file permissions:**
- Ensure write permissions in the project directory
- Close any spreadsheet applications that might lock the CSV file

**Timer accuracy:**
- Start timing immediately when presenting the question to AI
- Stop timing as soon as you receive the complete response

---

**Happy monitoring!** 🤖📊 Track your AI assistant's cognitive fitness daily and identify performance patterns over time. 