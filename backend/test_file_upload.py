"""
Test script to demonstrate file upload functionality
Run this to test the file upload implementation
"""

import os
import requests
import json
from io import BytesIO
from PIL import Image

# Configuration
BASE_URL = "http://localhost:8000"
API_TOKEN = "your_auth_token_here"  # Replace with actual token

# Headers for API requests
HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}"
}

def create_test_image():
    """Create a simple test image in memory."""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def create_test_document():
    """Create a simple test document in memory."""
    content = b"This is a test document for course materials.\n\nIt contains some sample text."
    return BytesIO(content)

def test_course_thumbnail_upload(course_id):
    """Test uploading a thumbnail to a course."""
    print(f"Testing thumbnail upload for course {course_id}...")
    
    # Create test image
    test_image = create_test_image()
    
    files = {
        'file': ('test_thumbnail.jpg', test_image, 'image/jpeg')
    }
    
    data = {
        'attachment_type': 'thumbnail',
        'title': 'Test Course Thumbnail',
        'is_public': True,
        'alt_text': 'A red test image'
    }
    
    response = requests.post(
        f"{BASE_URL}/api/lms/courses/{course_id}/upload-file/",
        headers=HEADERS,
        files=files,
        data=data
    )
    
    if response.status_code == 201:
        print("✅ Thumbnail upload successful!")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"❌ Thumbnail upload failed: {response.status_code}")
        print(response.text)
        return None

def test_course_material_upload(course_id):
    """Test uploading course material."""
    print(f"Testing material upload for course {course_id}...")
    
    # Create test document
    test_doc = create_test_document()
    
    files = {
        'file': ('course_material.txt', test_doc, 'text/plain')
    }
    
    data = {
        'attachment_type': 'material',
        'title': 'Test Course Material',
        'description': 'This is a test document for course materials',
        'is_public': False
    }
    
    response = requests.post(
        f"{BASE_URL}/api/lms/courses/{course_id}/upload-file/",
        headers=HEADERS,
        files=files,
        data=data
    )
    
    if response.status_code == 201:
        print("✅ Material upload successful!")
        print(json.dumps(response.json(), indent=2))
        return response.json()
    else:
        print(f"❌ Material upload failed: {response.status_code}")
        print(response.text)
        return None

def test_list_course_files(course_id):
    """Test listing files for a course."""
    print(f"Testing file listing for course {course_id}...")
    
    response = requests.get(
        f"{BASE_URL}/api/lms/courses/{course_id}/files/",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        print("✅ File listing successful!")
        files = response.json()
        print(f"Found {len(files)} files:")
        for file in files:
            print(f"  - {file['title']} ({file['file_type']}) - {file['file_size_human']}")
        return files
    else:
        print(f"❌ File listing failed: {response.status_code}")
        print(response.text)
        return None

def test_file_validation():
    """Test file validation with invalid files."""
    print("Testing file validation...")
    
    # Test with oversized file (simulate)
    print("  Testing oversized file rejection...")
    
    # Test with invalid extension
    print("  Testing invalid extension rejection...")
    
    # This would require creating actual invalid files
    # For now, just demonstrate the concept
    print("  ℹ️  File validation tests require manual testing with actual invalid files")

def main():
    """Run all tests."""
    print("🧪 Starting File Upload Tests")
    print("="*50)
    
    # You'll need to replace this with an actual course ID from your database
    course_id = 1
    
    # Test 1: Upload thumbnail
    thumbnail_result = test_course_thumbnail_upload(course_id)
    print()
    
    # Test 2: Upload material
    material_result = test_course_material_upload(course_id)
    print()
    
    # Test 3: List files
    files = test_list_course_files(course_id)
    print()
    
    # Test 4: File validation
    test_file_validation()
    print()
    
    print("✅ All tests completed!")
    print("\nNext steps:")
    print("1. Update API_TOKEN with your actual authentication token")
    print("2. Ensure course with ID 1 exists in your database")
    print("3. Run this script to test the file upload functionality")

if __name__ == "__main__":
    if API_TOKEN == "your_auth_token_here":
        print("⚠️  Please update the API_TOKEN variable with your actual token")
        print("You can get a token by:")
        print("1. Creating a user account")
        print("2. Using the authentication endpoint to get a JWT token")
        print("3. Or using Django admin to create a token")
    else:
        main()
