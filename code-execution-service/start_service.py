#!/usr/bin/env python3
"""
Startup script for Code Execution Service
"""

import uvicorn
import os
import sys

if __name__ == "__main__":
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("🚀 Starting Code Execution Service...")
    print("📁 Working directory:", os.getcwd())
    print("🔑 Loading Firebase credentials from service-account.json")
    print("🔌 Service will be available at: http://localhost:8001")
    print("📚 API documentation at: http://localhost:8001/docs")
    print("=" * 60)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        sys.exit(1)
