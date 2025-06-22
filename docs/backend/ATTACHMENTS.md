# Attachments App

A Django app for handling file uploads with generic relationships, allowing any model to have attachments.

## Features

- 🔗 **Generic Foreign Key** - Attach files to any Django model
- 👤 **User Tracking** - Track who uploaded each file
- 🏷️ **Tagging System** - Organize attachments with tags
- 📂 **File Type Detection** - Automatic file type classification
- 🔍 **Advanced Filtering** - Filter by type, size, date, user, etc.
- 📏 **Size Validation** - Configurable file size limits
- 🎨 **Admin Interface** - Full Django admin integration

## Models

### Attachment

The main model for file uploads with these key features:

```python
class Attachment(AbstractTimestampedModel):
    # File fields
    file = FileField(upload_to=get_file_upload_path)
    original_filename = CharField(max_length=255)
    file_size = PositiveIntegerField()
    file_type = CharField(choices=FILE_TYPE_CHOICES)
    mime_type = CharField(max_length=100)
    
    # Metadata
    title = CharField(max_length=255)
    description = TextField()
    alt_text = CharField(max_length=255)
    
    # Generic relationship - can attach to ANY model
    content_type = ForeignKey(ContentType)
    object_id = PositiveIntegerField()
    content_object = GenericForeignKey()
    
    # User tracking
    uploaded_by = ForeignKey(User)
    
    # Flags
    is_public = BooleanField(default=False)
    is_featured = BooleanField(default=False)
```

### AttachmentTag

For organizing attachments:

```python
class AttachmentTag(AbstractTimestampedModel):
    name = CharField(max_length=50, unique=True)
    slug = SlugField(max_length=50, unique=True)
    color = CharField(max_length=7, default='#007bff')
```

## API Endpoints

### Attachments

- `GET /api/attachments/attachments/` - List all attachments
- `POST /api/attachments/attachments/` - Upload new attachment
- `GET /api/attachments/attachments/{id}/` - Get attachment details
- `PUT /api/attachments/attachments/{id}/` - Update attachment
- `DELETE /api/attachments/attachments/{id}/` - Delete attachment

### Custom Actions

- `GET /api/attachments/attachments/my_attachments/` - Get current user's attachments
- `GET /api/attachments/attachments/images/` - Get only image attachments
- `GET /api/attachments/attachments/documents/` - Get only document attachments
- `POST /api/attachments/attachments/attach_to_object/` - Attach file to specific object
- `GET /api/attachments/attachments/for_object/` - Get attachments for specific object

### Tags

- `GET /api/attachments/tags/` - List all tags
- `POST /api/attachments/tags/` - Create new tag
- `GET /api/attachments/tags/{id}/` - Get tag details
- `PUT /api/attachments/tags/{id}/` - Update tag
- `DELETE /api/attachments/tags/{id}/` - Delete tag

## Usage Examples

### 1. Upload a File

```python
# POST /api/attachments/attachments/
{
    "file": <file_upload>,
    "title": "My Document",
    "description": "Important document",
    "is_public": true
}
```

### 2. Attach File to Object

```python
# POST /api/attachments/attachments/attach_to_object/
{
    "attachment_id": 123,
    "content_type_id": 15,  # ContentType ID for your model
    "object_id": 456        # ID of your object
}
```

### 3. Get Attachments for Object

```python
# GET /api/attachments/attachments/for_object/?content_type_id=15&object_id=456
```

### 4. Filter Attachments

```python
# GET /api/attachments/attachments/?file_type=image&is_public=true&created_after=2024-01-01
```

## Using with Your Models

### Option 1: Using the Mixin

```python
from apps.attachments.utils import AttachmentMixin

class BlogPost(models.Model, AttachmentMixin):
    title = models.CharField(max_length=200)
    content = models.TextField()
    
    # Now you can use:
    # post.get_attachments()
    # post.get_images()
    # post.attach_file(file, user)
    # post.attachment_count
```

### Option 2: Using Utility Functions

```python
from apps.attachments.utils import attach_file_to_object, get_attachments_for_object

# Attach file to any object
attach_file_to_object(uploaded_file, my_object, request.user)

# Get attachments for any object
attachments = get_attachments_for_object(my_object)
```

### Option 3: Direct Model Usage

```python
from django.contrib.contenttypes.models import ContentType
from apps.attachments.models import Attachment

# Create attachment directly
content_type = ContentType.objects.get_for_model(BlogPost)
attachment = Attachment.objects.create(
    file=uploaded_file,
    content_type=content_type,
    object_id=blog_post.id,
    uploaded_by=request.user
)
```

## File Organization

Files are automatically organized in the following structure:

```
media/
├── attachments/
│   ├── blogpost/
│   │   ├── 1/
│   │   │   ├── abc123.jpg
│   │   │   └── def456.pdf
│   │   └── 2/
│   ├── user/
│   │   └── 1/
│   └── orphaned/  # Files not attached to objects
```

## Supported File Types

### Images
- JPG, JPEG, PNG, GIF, WebP, SVG, BMP

### Documents
- PDF, DOC, DOCX, TXT, XLSX, XLS, PPT, PPTX

### Videos
- MP4, AVI, MOV, WebM, MKV

### Audio
- MP3, WAV, OGG, FLAC, M4A

## Configuration

### File Size Limits

In `apps/core/constants.py`:

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

### Allowed Extensions

```python
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx']
```

## Advanced Features

### Custom Managers

```python
# Get only images
Attachment.objects.images()

# Get attachments for specific user
Attachment.objects.by_user(user)

# Get attachments for specific object
Attachment.objects.for_object(my_object)
```

### File Properties

```python
attachment = Attachment.objects.get(id=1)

attachment.file_size_human  # "2.5 MB"
attachment.file_extension   # ".jpg"
attachment.is_image        # True/False
attachment.is_document     # True/False
attachment.file_url        # Full URL to file
```

### Tagging

```python
# Create tags
tag1 = AttachmentTag.objects.create(name="Important", color="#ff0000")
tag2 = AttachmentTag.objects.create(name="Draft", color="#ffaa00")

# Add tags to attachment
attachment.taggings.create(tag=tag1)
attachment.taggings.create(tag=tag2)

# Filter by tags
Attachment.objects.filter(taggings__tag__name="Important")
```

## Security Considerations

1. **User Isolation** - Users can only see their own attachments (unless staff)
2. **File Validation** - Extension and size validation
3. **Unique Filenames** - UUIDs prevent filename conflicts
4. **Permission Checks** - Authentication required for all operations

## Admin Interface

The app includes a comprehensive Django admin interface with:

- File upload and management
- Inline tag editing
- Advanced filtering and searching
- File size and type information
- User tracking

## Testing

Run tests with:

```bash
python manage.py test apps.attachments
```

The test suite covers:
- File upload functionality
- Generic relationship handling
- User permissions
- File type detection
- Tag management
