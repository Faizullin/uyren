"""
Simple synchronous test script for online code execution API
Uses httpx sync client for easier usage
"""

import httpx
import json


def test_online_compiler_sync(token: str):
    """Simple synchronous function to test online compiler API"""
    
    # API configuration
    api_url = "https://api.codex.jaagrav.in"  # Example online compiler API
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json"
    }
    
    # Add authorization if token provided
    if token:
        headers["Authorization"] = token
    
    # Sample Python code to test
    test_code = """
print("Hello from online compiler!")
name = input("Enter your name: ")
print(f"Welcome {name}!")
for i in range(3):
    print(f"Count: {i + 1}")
print("Execution completed!")
"""
    
    # Test input data
    input_data = "Alice"
    
    # Request body
    body = {
        "code": test_code,
        "input": input_data,
        "compiler": "python3"
    }
    
    print("🚀 Testing online compiler (sync version)...")
    print(f"📝 Code to execute:\n{test_code}")
    print(f"📥 Input data: {input_data}")
    print("-" * 50)
    
    try:
        with httpx.Client(timeout=30.0) as client:
            print("📡 Sending request to API...")
            
            response = client.post(
                api_url,
                headers=headers,
                content=json.dumps(body)
            )
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Execution successful!")
                print(f"📤 Output:\n{result.get('output', 'No output')}")
                
                if result.get('error'):
                    print(f"❌ Errors:\n{result.get('error')}")
                
                if result.get('cpuTime'):
                    print(f"⏱️ Execution time: {result.get('cpuTime')}")
                
                if result.get('memory'):
                    print(f"💾 Memory usage: {result.get('memory')}")
                
                return result
                    
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
    except httpx.TimeoutException:
        print("⏰ Request timed out")
        return None
    except httpx.RequestError as e:
        print(f"🌐 Network error: {e}")
        return None
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return None


def test_multiple_languages():
    """Test different programming languages"""
    
    test_cases = [
        {
            "name": "Python",
            "code": 'print("Hello from Python!")\nprint(2 + 2)',
            "compiler": "python3",
            "input": ""
        },
        {
            "name": "JavaScript",
            "code": 'console.log("Hello from JavaScript!");\nconsole.log(2 + 2);',
            "compiler": "nodejs",
            "input": ""
        },
        {
            "name": "Java",
            "code": '''
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.println(2 + 2);
    }
}''',
            "compiler": "java",
            "input": ""
        }
    ]
    
    print("\n🧪 Testing multiple languages...")
    print("=" * 50)
    
    for test_case in test_cases:
        print(f"\n🔍 Testing {test_case['name']}...")
        
        body = {
            "code": test_case["code"],
            "input": test_case["input"],
            "compiler": test_case["compiler"]
        }
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.codex.jaagrav.in",
                    headers={"Content-Type": "application/json"},
                    content=json.dumps(body)
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ {test_case['name']} output: {result.get('output', 'No output')}")
                else:
                    print(f"❌ {test_case['name']} failed: {response.status_code}")
                    
        except Exception as e:
            print(f"💥 {test_case['name']} error: {e}")


def main():
    """Main function with token input and menu"""
    print("🧪 Simple Online Compiler Test (Sync)")
    print("=" * 40)
    
    # Get token from user input
    token = input("Enter your API token (or press Enter for no auth): ").strip()
    
    if not token:
        print("⚠️ No token provided - testing without authentication")
    else:
        print("🔑 Token provided - testing with authentication")
    
    print("\nChoose test option:")
    print("1. Single Python test")
    print("2. Multiple language test")
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "2":
        test_multiple_languages()
    else:
        # Run single test
        result = test_online_compiler_sync(token)
        
        if result:
            print(f"\n📋 Full response: {json.dumps(result, indent=2)}")
    
    print("\n✨ Test completed!")


if __name__ == "__main__":
    main()
