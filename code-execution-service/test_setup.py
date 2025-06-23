#!/usr/bin/env python3
"""
Simple test script to verify Firebase authentication is properly configured
"""

import sys
import os
import json

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_firebase_setup():
    """Test if Firebase service account can be loaded"""
    print("Testing Firebase service account setup...")
    
    try:
        from app.services.firebase_auth import FirebaseAuthService
        
        # Create instance (this will trigger initialization)
        auth_service = FirebaseAuthService()
        print("✅ Firebase authentication service initialized successfully")
        
        # Check if service account file exists
        service_account_paths = [
            "service-account.json",
            "app/service-account.json",
            "../service-account.json"
        ]
        
        found_path = None
        for path in service_account_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                found_path = abs_path
                break
        
        if found_path:
            print(f"✅ Service account file found at: {found_path}")
            
            # Validate JSON structure
            with open(found_path, 'r') as f:
                service_account = json.load(f)
                
            required_fields = ['type', 'project_id', 'private_key', 'client_email']
            missing_fields = [field for field in required_fields if field not in service_account]
            
            if missing_fields:
                print(f"❌ Service account file missing required fields: {missing_fields}")
                return False
            else:
                print(f"✅ Service account file structure is valid")
                print(f"   Project ID: {service_account.get('project_id')}")
                print(f"   Client Email: {service_account.get('client_email')}")
        else:
            print("⚠️  Service account file not found in expected locations")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Firebase setup error: {e}")
        return False


def test_environment_config():
    """Test environment configuration"""
    print("\nTesting environment configuration...")
    
    try:
        from app.config import settings
        
        print(f"✅ Configuration loaded successfully")
        print(f"   Redis URL: {settings.redis_url}")
        print(f"   Host: {settings.host}")
        print(f"   Port: {settings.port}")
        print(f"   Debug: {settings.debug}")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False


if __name__ == "__main__":
    print("🧪 FastAPI Code Execution Service - Setup Test")
    print("=" * 50)
    
    success = True
    
    success &= test_environment_config()
    success &= test_firebase_setup()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! Service is ready to use.")
        print("\nTo start the service:")
        print("   cd code-execution-service")
        print("   pip install -r requirements.txt")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001")
    else:
        print("❌ Some tests failed. Please check the configuration.")
        
    sys.exit(0 if success else 1)
