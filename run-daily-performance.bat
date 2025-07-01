@echo off
echo ========================================
echo     🌅 DAILY AI PERFORMANCE CHECK
echo ========================================
echo Starting automated performance testing...

cd /d "%~dp0"
node daily-runner.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Daily performance check completed successfully!
    echo 📊 Check the Reports folder for detailed results
    echo 📋 View daily-results.log for simple tracking
) else (
    echo.
    echo ❌ Daily performance check failed!
    echo Check the Logs folder for error details
)

echo.
echo Press any key to exit...
pause > nul 