"""
Simple test script for online code execution API
Direct HTTP client test with token input
"""

import httpx
import json
import asyncio


async def test_online_compiler(token: str):
    """Simple function to test online compiler API"""
    
    # API configuration
    api_url = "https://onlinecompiler.io/api/v2/run-code/"  # Example online compiler API
    headers = {
        "Accept": "*/*",
        "Authorization": token,
        "Content-Type": "application/json"
    }
    
    # Sample code to test
    test_code = """
print("Hello from online compiler!")
name = input("Enter your name: ")
print(f"Welcome {name}!")
for i in range(3):
    print(f"Count: {i + 1}")
"""
    
    # Test input data
    input_data = "Alice"
    
    # Request body
    body = {
        "code": test_code,
        "input": input_data,
        "compiler": "python-3.9.7"
    }
    
    print("🚀 Testing online compiler...")
    print(f"📝 Code to execute:\n{test_code}")
    print(f"📥 Input data: {input_data}")
    print("-" * 50)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("📡 Sending request to API...")
            
            response = await client.post(
                api_url,
                headers=headers,
                data=json.dumps(body)
            )
            
            print(f"📊 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.text
                print("✅ Execution successful!")
                print(f"📤 Output[text]: {result}\n")                    
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                
    except httpx.TimeoutException:
        print("⏰ Request timed out")
    except httpx.RequestError as e:
        print(f"🌐 Network error: {e}")
    except Exception as e:
        print(f"💥 Unexpected error: {e}")


def main():
    """Main function with token input"""
    print("🧪 Simple Online Compiler Test")
    print("=" * 40)
    
    # Get token from user input
    token = input("Enter your API token (or press Enter for no auth): ").strip()
    
    if not token:
        token = ""
        print("⚠️ No token provided - testing without authentication")
    else:
        print("🔑 Token provided - testing with authentication")
    
    # Run the test
    asyncio.run(test_online_compiler(token))
    
    print("\n✨ Test completed!")


if __name__ == "__main__":
    main()
