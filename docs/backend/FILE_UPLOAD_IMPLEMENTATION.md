# Course File Upload Implementation

This document explains how to use the file upload functionality for courses.

## Overview

The file upload system has been implemented using:

1. **Base Components:**
   - `Attachment` model (generic file storage)
   - `AttachmentUploadSerializer` (file validation)
   - `FileUploadMixin` (reusable upload functionality)

2. **Course-Specific Components:**
   - `CourseFileUploadSerializer` (course-specific validation)
   - Extended `CourseViewSet` with file upload capabilities

## API Endpoints

### Upload File to Course
```
POST /api/lms/courses/{course_id}/upload-file/
Content-Type: multipart/form-data

Form data:
- file: (file) The file to upload
- attachment_type: (string) One of: 'thumbnail', 'material', 'resource'
- title: (string, optional) Custom title for the file
- description: (string, optional) File description
- alt_text: (string, optional) Alt text for images
- is_public: (boolean, optional) Whether file is publicly accessible
- is_featured: (boolean, optional) Whether file is featured
```

### List Course Files
```
GET /api/lms/courses/{course_id}/files/
Query parameters:
- file_type: (optional) Filter by 'image', 'document', 'video', 'audio', 'other'
```

### Delete Course File
```
DELETE /api/lms/courses/{course_id}/files/{attachment_id}/
```

## File Validation Rules

### General Rules
- Maximum file size: 10MB
- Allowed extensions: jpg, jpeg, png, gif, webp, svg, bmp, pdf, doc, docx, txt, xlsx, xls, ppt, pptx, mp4, avi, mov, webm, mkv, mp3, wav, ogg, flac, m4a

### Course-Specific Rules
- **Thumbnails**: Must be image files (jpg, jpeg, png, gif, webp, svg, bmp)
- **Materials**: Must be documents or videos (pdf, doc, docx, txt, xlsx, xls, ppt, pptx, mp4, avi, mov, webm, mkv)
- **Resources**: Any allowed file type

## Usage Examples

### Upload Course Thumbnail
```bash
curl -X POST "http://localhost:8000/api/lms/courses/1/upload-file/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@thumbnail.jpg" \
  -F "attachment_type=thumbnail" \
  -F "title=Course Thumbnail" \
  -F "is_public=true"
```

### Upload Course Material
```bash
curl -X POST "http://localhost:8000/api/lms/courses/1/upload-file/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@lesson1.pdf" \
  -F "attachment_type=material" \
  -F "title=Lesson 1 Notes" \
  -F "description=Introduction to the course material"
```

### List Course Files
```bash
curl -X GET "http://localhost:8000/api/lms/courses/1/files/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Only Course Images
```bash
curl -X GET "http://localhost:8000/api/lms/courses/1/files/?file_type=image" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### JavaScript Example
```javascript
// Upload file to course
async function uploadCourseFile(courseId, file, attachmentType, metadata = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('attachment_type', attachmentType);
  
  // Add optional metadata
  Object.keys(metadata).forEach(key => {
    if (metadata[key] !== undefined) {
      formData.append(key, metadata[key]);
    }
  });
  
  const response = await fetch(`/api/lms/courses/${courseId}/upload-file/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  return response.json();
}

// Usage
const file = document.getElementById('fileInput').files[0];
const result = await uploadCourseFile(1, file, 'thumbnail', {
  title: 'My Course Thumbnail',
  is_public: true
});
```

## Security Features

1. **Authentication Required**: All file operations require authentication
2. **File Validation**: Strict file type and size validation
3. **Permission Checks**: Users can only delete their own uploads (unless staff)
4. **Unique Filenames**: All uploaded files get unique names to prevent conflicts

## Extending to Other Models

To add file upload to other models (e.g., Lessons, Posts), simply:

1. Extend the ViewSet with `FileUploadMixin`
2. Create a model-specific upload serializer if needed
3. Override `get_file_upload_serializer_class()` and `handle_attachment_created()` methods

Example for Lessons:
```python
class LessonViewSet(FileUploadMixin, viewsets.ModelViewSet):
    # ... existing code ...
    
    def get_file_upload_serializer_class(self):
        return LessonFileUploadSerializer  # Create this serializer
    
    def handle_attachment_created(self, lesson, attachment, request_data):
        # Handle lesson-specific logic
        pass
```

## Database Schema

The attachment system uses a generic foreign key to link files to any model:

```python
# Attachment model fields
content_type = ForeignKey(ContentType)  # Links to any model
object_id = PositiveIntegerField()       # ID of the linked object
content_object = GenericForeignKey()     # The actual linked object
```

This allows the same attachment system to work with Courses, Lessons, Posts, or any other model.
