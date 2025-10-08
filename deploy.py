#!/usr/bin/env python3
"""
Production deployment script for YK-CSV
Run this on your HostPapa server to start the backend
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting YK-CSV Backend for Production...")
    
    # Change to backend directory
    os.chdir('backend')
    
    # Activate virtual environment if it exists
    if os.path.exists('venv/bin/activate'):
        print("📦 Activating virtual environment...")
        activate_cmd = "source venv/bin/activate"
    else:
        print("⚠️  No virtual environment found, using system Python")
        activate_cmd = ""
    
    # Install/update requirements
    print("📥 Installing requirements...")
    if activate_cmd:
        install_cmd = f"{activate_cmd} && pip install -r requirements.txt"
    else:
        install_cmd = "pip install -r requirements.txt"
    
    subprocess.run(install_cmd, shell=True, check=True)
    
    # Start the server
    print("🌐 Starting FastAPI server...")
    if activate_cmd:
        start_cmd = f"{activate_cmd} && python main.py"
    else:
        start_cmd = "python main.py"
    
    subprocess.run(start_cmd, shell=True)

if __name__ == "__main__":
    main()
