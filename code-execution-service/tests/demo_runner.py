"""
Demo script for testing the Code Execution Service with online compiler
This script demonstrates all the functionality and provides real examples
"""

import asyncio
import json
import time
from typing import Dict, Any, List
import httpx
from datetime import datetime

# Configuration
SERVICE_URL = "http://localhost:8001"
API_BASE = f"{SERVICE_URL}/api/v1"

# Mock Firebase token for demo (in real usage, get this from Firebase)
DEMO_TOKEN = input("TOKEN:")

# Demo code samples for different languages
DEMO_CODES = {
    "python": {
        "hello_world": {
            "code": 'print("Hello from Python!")',
            "input": "",
            "expected": "Hello from Python!"
        },
        "fibonacci": {
            "code": '''
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

n = int(input("Enter a number: "))
result = fibonacci(n)
print(f"Fibonacci of {n} is {result}")
''',
            "input": "10",
            "expected": "Fibonacci of 10 is 55"
        },
        "math_operations": {
            "code": '''
import math

# Basic math operations
numbers = [1, 2, 3, 4, 5]
print(f"Numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers) / len(numbers)}")
print(f"Square root of 16: {math.sqrt(16)}")
print(f"2 to the power of 8: {2 ** 8}")
''',
            "input": "",
            "expected": "Numbers: [1, 2, 3, 4, 5]"
        },
        "error_example": {
            "code": '''
# This will cause an error
print("Before error")
undefined_variable + 5
print("This won't be reached")
''',
            "input": "",
            "expected": "NameError"
        }
    },
    "javascript": {
        "hello_world": {
            "code": 'console.log("Hello from JavaScript!");',
            "input": "",
            "expected": "Hello from JavaScript!"
        },
        "array_operations": {
            "code": '''
const numbers = [1, 2, 3, 4, 5];
console.log("Numbers:", numbers);
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
console.log("Doubled:", numbers.map(x => x * 2));
console.log("Even numbers:", numbers.filter(x => x % 2 === 0));
''',
            "input": "",
            "expected": "Numbers: [ 1, 2, 3, 4, 5 ]"
        }
    },
    "java": {
        "hello_world": {
            "code": '''
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
''',
            "input": "",
            "expected": "Hello from Java!"
        },
        "calculator": {
            "code": '''
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter first number: ");
        double num1 = scanner.nextDouble();
        
        System.out.print("Enter second number: ");
        double num2 = scanner.nextDouble();
        
        System.out.println("Sum: " + (num1 + num2));
        System.out.println("Difference: " + (num1 - num2));
        System.out.println("Product: " + (num1 * num2));
        System.out.println("Division: " + (num1 / num2));
        
        scanner.close();
    }
}
''',
            "input": "10\\n5",
            "expected": "Sum: 15.0"
        }
    },
    "cpp": {
        "hello_world": {
            "code": '''
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
''',
            "input": "",
            "expected": "Hello from C++!"
        },
        "sorting": {
            "code": '''
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    
    cout << "Original array: ";
    for(int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted array: ";
    for(int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}
''',
            "input": "",
            "expected": "Original array: 64 34 25 12 22 11 90"
        }
    }
}


class CodeExecutionDemo:
    """Demo class for testing code execution service"""
    
    def __init__(self, service_url: str = SERVICE_URL):
        self.service_url = service_url
        self.api_base = f"{service_url}/api/v1"
        self.headers = {
            "Authorization": f"Bearer {DEMO_TOKEN}",
            "Content-Type": "application/json"
        }
    
    async def check_service_health(self) -> bool:
        """Check if the service is running and healthy"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.service_url}/health/")
                if response.status_code == 200:
                    print("✅ Service is healthy")
                    return True
                else:
                    print(f"❌ Service health check failed: {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Cannot connect to service: {e}")
            return False
    
    async def submit_code_execution(self, language: str, code: str, input_data: str = "") -> str:
        """Submit code for execution"""
        payload = {
            "code": code,
            "language": language,
            "input_data": input_data
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base}/executions/execute",
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    execution_id = result["execution_id"]
                    print(f"📝 Code submitted successfully. Execution ID: {execution_id}")
                    return execution_id
                else:
                    print(f"❌ Code submission failed: {response.status_code}")
                    print(response.text)
                    return None
                    
        except Exception as e:
            print(f"❌ Error submitting code: {e}")
            return None
    
    async def wait_for_completion(self, execution_id: str, timeout: int = 30) -> Dict[str, Any]:
        """Wait for code execution to complete"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{self.api_base}/executions/status/{execution_id}",
                        headers=self.headers
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        status = result.get("status")
                        
                        if status in ["completed", "error"]:
                            return result
                        elif status == "running":
                            print("⏳ Code is still running...")
                        
                        await asyncio.sleep(1)
                    else:
                        print(f"❌ Error checking status: {response.status_code}")
                        break
                        
            except Exception as e:
                print(f"❌ Error checking execution status: {e}")
                break
        
        print("⏰ Timeout waiting for execution completion")
        return None
    
    async def run_single_demo(self, language: str, demo_name: str, demo_config: Dict[str, str]):
        """Run a single demo example"""
        print(f"\\n🚀 Running {language} demo: {demo_name}")
        print("=" * 50)
        
        code = demo_config["code"].strip()
        input_data = demo_config["input"]
        expected = demo_config["expected"]
        
        print(f"📋 Code:\\n{code[:200]}{'...' if len(code) > 200 else ''}")
        if input_data:
            print(f"📥 Input: {input_data}")
        print(f"🎯 Expected: {expected}")
        print()
        
        # Submit execution
        execution_id = await self.submit_code_execution(language, code, input_data)
        if not execution_id:
            return False
        
        # Wait for completion
        result = await self.wait_for_completion(execution_id)
        if not result:
            return False
        
        # Display results
        print(f"📊 Execution Results:")
        print(f"   Status: {result.get('status')}")
        print(f"   Execution Time: {result.get('execution_time', 'N/A')}")
        print(f"   Memory Usage: {result.get('memory_usage', 'N/A')}")
        
        output = result.get('output', '').strip()
        error_output = result.get('error_output', '').strip()
        
        if output:
            print(f"📤 Output:\\n{output}")
        
        if error_output:
            print(f"❌ Error Output:\\n{error_output}")
        
        # Check if output matches expected (for successful cases)
        if result.get('status') == 'completed' and output and expected in output:
            print("✅ Output matches expected result!")
            return True
        elif result.get('status') == 'error' and 'error_example' in demo_name:
            print("✅ Error occurred as expected!")
            return True
        else:
            print("⚠️  Output doesn't match expected result")
            return False
    
    async def run_language_demos(self, language: str):
        """Run all demos for a specific language"""
        if language not in DEMO_CODES:
            print(f"❌ No demos available for language: {language}")
            return
        
        print(f"\\n🎯 Running {language.upper()} Demos")
        print("=" * 60)
        
        demos = DEMO_CODES[language]
        success_count = 0
        
        for demo_name, demo_config in demos.items():
            success = await self.run_single_demo(language, demo_name, demo_config)
            if success:
                success_count += 1
            
            # Wait between demos
            await asyncio.sleep(2)
        
        print(f"\\n📈 {language.upper()} Results: {success_count}/{len(demos)} demos successful")
    
    async def run_all_demos(self):
        """Run all available demos"""
        print("🎉 Starting Code Execution Service Demo")
        print("=" * 60)
        
        # Check service health first
        if not await self.check_service_health():
            return
        
        total_success = 0
        total_demos = sum(len(demos) for demos in DEMO_CODES.values())
        
        # Run demos for each language
        for language in DEMO_CODES.keys():
            await self.run_language_demos(language)
            total_success += sum(1 for _ in DEMO_CODES[language])  # Simplified counting
        
        print(f"\\n🏆 Overall Results: {total_success}/{total_demos} demos completed")
        print("\\n✨ Demo completed!")
    
    async def interactive_demo(self):
        """Run interactive demo where user can input custom code"""
        print("\\n🎮 Interactive Code Execution Demo")
        print("=" * 50)
        
        if not await self.check_service_health():
            return
        
        while True:
            print("\\nAvailable languages:", ", ".join(DEMO_CODES.keys()) + ", or 'quit' to exit")
            language = input("Enter language: ").strip().lower()
            
            if language == 'quit':
                break
            
            if language not in DEMO_CODES and language not in ['python', 'javascript', 'java', 'cpp', 'c']:
                print("❌ Unsupported language")
                continue
            
            print("\\nEnter your code (press Enter twice to finish):")
            code_lines = []
            while True:
                line = input()
                if not line and code_lines:
                    break
                code_lines.append(line)
            
            code = "\\n".join(code_lines)
            if not code.strip():
                print("❌ No code entered")
                continue
            
            input_data = input("Enter input data (optional): ").strip()
            
            print("\\n🚀 Executing your code...")
            execution_id = await self.submit_code_execution(language, code, input_data)
            
            if execution_id:
                result = await self.wait_for_completion(execution_id)
                if result:
                    print(f"\\n📊 Results:")
                    print(f"Status: {result.get('status')}")
                    if result.get('output'):
                        print(f"Output:\\n{result['output']}")
                    if result.get('error_output'):
                        print(f"Error:\\n{result['error_output']}")


async def main():
    """Main demo function"""
    demo = CodeExecutionDemo()
    
    print("Code Execution Service Demo")
    print("Choose an option:")
    print("1. Run all automated demos")
    print("2. Run demos for specific language")
    print("3. Interactive demo (enter your own code)")
    print("4. Health check only")
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == "1":
        await demo.run_all_demos()
    elif choice == "2":
        print("Available languages:", ", ".join(DEMO_CODES.keys()))
        language = input("Enter language: ").strip().lower()
        await demo.run_language_demos(language)
    elif choice == "3":
        await demo.interactive_demo()
    elif choice == "4":
        await demo.check_service_health()
    else:
        print("Invalid choice")


if __name__ == "__main__":
    print("🔧 Starting Code Execution Service Demo")
    print("Make sure the service is running on http://localhost:8001")
    print("=" * 60)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\n🛑 Demo interrupted by user")
    except Exception as e:
        print(f"\\n❌ Demo failed with error: {e}")
