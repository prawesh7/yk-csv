#!/bin/bash
# YK-CSV Production Startup Script for HostPapa

echo "🚀 Starting YK-CSV Production Server..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "❌ Error: build directory not found. Please run 'npm run build' first."
    exit 1
fi

# Navigate to backend
cd backend

# Check for virtual environment
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  No virtual environment found, using system Python"
fi

# Install requirements
echo "📥 Installing/updating requirements..."
pip install -r requirements.txt

# Start the server
echo "🌐 Starting FastAPI server on port 8000..."
echo "📱 Frontend files are in the ../build directory"
echo "🔗 Make sure to configure your web server to serve the build directory"
echo ""

python main.py