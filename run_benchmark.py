#!/usr/bin/env python3
"""
AI Performance Benchmark Test Launcher
=====================================
Click to run the 20-question AI benchmark test.
Results are automatically saved to benchmark_results.csv
"""

import subprocess
import sys
import os
import time
from datetime import datetime

def print_banner():
    """Display the startup banner"""
    print("\n" + "="*50)
    print("🚀 AI PERFORMANCE BENCHMARK LAUNCHER")
    print("="*50)
    print("📊 20 Questions • 5 Categories • 240 Points Total")
    print("⏱️  Automatic timing and scoring")
    print("💾 Results saved to benchmark_results.csv")
    print("="*50 + "\n")

def check_dependencies():
    """Check if Node.js and required packages are available"""
    try:
        # Check if Node.js is installed
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Node.js is not installed. Please install Node.js first.")
            return False
        
        print(f"✅ Node.js version: {result.stdout.strip()}")
        
        # Check if package.json exists
        if not os.path.exists('package.json'):
            print("❌ package.json not found. Please run 'npm install' first.")
            return False
        
        # Check if ai-monitor.js exists
        if not os.path.exists('ai-monitor.js'):
            print("❌ ai-monitor.js not found.")
            return False
        
        print("✅ All dependencies found")
        return True
        
    except FileNotFoundError:
        print("❌ Node.js is not installed or not in PATH.")
        return False

def run_benchmark():
    """Run the AI benchmark test"""
    print("🔄 Starting AI Benchmark Test...")
    print("⏳ This will take 2-5 minutes to complete...\n")
    
    try:
        # Run the benchmark test
        start_time = time.time()
        
        # Execute the Node.js script
        process = subprocess.Popen(
            ['node', 'ai-monitor.js'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
        
        # Wait for process to complete
        process.wait()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        if process.returncode == 0:
            print("\n" + "="*50)
            print("✅ BENCHMARK TEST COMPLETED!")
            print(f"⏱️  Total execution time: {execution_time:.1f} seconds")
            print("📊 Check benchmark_results.csv for detailed results")
            print("="*50 + "\n")
        else:
            print("\n❌ Test failed with errors:")
            print(process.stderr.read())
            
    except Exception as e:
        print(f"\n❌ Error running benchmark: {e}")

def main():
    """Main function"""
    print_banner()
    
    # Check if we're in the right directory
    if not os.path.exists('ai-monitor.js'):
        print("❌ Please run this script from the Claude-Performance directory")
        print("🔄 Auto-closing in 3 seconds...")
        time.sleep(3)
        return
    
    # Check dependencies
    if not check_dependencies():
        print("🔄 Auto-closing in 3 seconds...")
        time.sleep(3)
        return
    
    # Run the benchmark
    print("🎯 Ready to run AI Performance Benchmark!")
    print("💡 The test will automatically start in 3 seconds...")
    
    try:
        for i in range(3, 0, -1):
            print(f"⏳ Starting in {i}...", end='\r')
            time.sleep(1)
        
        print("\n🚀 Starting benchmark test now!\n")
        run_benchmark()
        
    except KeyboardInterrupt:
        print("\n\n❌ Test cancelled by user")
    
    # Auto-close after showing results for 3 seconds
    print("🔄 Auto-closing in 3 seconds...")
    for i in range(3, 0, -1):
        print(f"⏳ Closing in {i}...", end='\r')
        time.sleep(1)
    print("\n👋 Goodbye!")

if __name__ == "__main__":
    main() 