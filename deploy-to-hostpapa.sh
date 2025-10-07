#!/bin/bash
# Simple deployment script for GitHub to HostPapa

echo "🚀 Deploying YK-CSV to HostPapa..."

# Get the latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install and build frontend
echo "🏗️ Building frontend..."
npm install
npm run build

# Set up backend
echo "🐍 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Kill existing process
echo "🔄 Restarting backend service..."
pkill -f "python.*main.py" || echo "No existing process to kill"

# Start backend in background
echo "🌐 Starting backend server..."
nohup python main.py > app.log 2>&1 &
echo $! > app.pid

echo "✅ Deployment completed!"
echo "📱 Frontend: Available in build/ directory"
echo "🔗 Backend: Running on port 8000"
echo "📋 Logs: Check backend/app.log"
