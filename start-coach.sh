#!/bin/bash

# Coding Coach AI Startup Script
# This script starts your coding coach with persistent memory

echo "🚀 Starting Coding Coach AI..."
echo "📁 Data will be saved to: ./data/"
echo "🌐 Access at: http://localhost:3001"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create data directory if it doesn't exist
mkdir -p data

echo "✅ Starting server..."
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
