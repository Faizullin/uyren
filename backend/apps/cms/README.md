# CMS App

**Admin-Only** Content Management System using existing Post and Attachment models.

## Overview

This CMS app provides a simplified interface for managing blog posts and file attachments using the existing `Post` and `Attachment` models from the `posts` and `attachments` apps respectively. **All CMS operations require admin (staff) privileges.**

## Features

- **Post Management**: CRUD operations for posts with status management (Admin only)
- **File Attachments**: Upload and manage files with post associations (Admin only)
- **Publication Control**: Publish/unpublish posts (Admin only)
- **Featured Content**: Mark posts as featured for highlighting (Admin only)
- **View Tracking**: Track post view counts (Admin only)
- **Search & Filtering**: Advanced filtering and search capabilities (Admin only)
- **Publishing workflow** (draft → published)
- **Featured posts** support
- **View tracking** and metrics
- **SEO fields** (meta title, description, keywords)
- **File attachments** through many-to-many relationship

### File Management
- **Upload/manage attachments** (images, documents)
- **Public/private** file access control
- **Orphaned file cleanup**
- **File metadata** tracking (size, type, MIME type)

## API Endpoints

### Posts API (`/api/v1/posts/`)

#### List/Create Posts
- `GET /api/v1/posts/` - List all CMS posts
- `POST /api/v1/posts/` - Create new post

#### Post Details
- `GET /api/v1/posts/{id}/` - Get post details
- `PUT /api/v1/posts/{id}/` - Update post
- `PATCH /api/v1/posts/{id}/` - Partial update
- `DELETE /api/v1/posts/{id}/` - Delete post

#### Post Actions
- `POST /api/v1/posts/{id}/publish/` - Publish post
- `POST /api/v1/posts/{id}/unpublish/` - Unpublish post
- `POST /api/v1/posts/{id}/feature/` - Feature post
- `POST /api/v1/posts/{id}/unfeature/` - Unfeature post
- `POST /api/v1/posts/{id}/increment_views/` - Increment view count
- `POST /api/v1/posts/{id}/attach_file/` - Attach file to post
- `DELETE /api/v1/posts/{id}/detach_file/` - Detach file from post

### Attachments API (`/api/v1/attachments/`)

#### List/Create Attachments
- `GET /api/v1/attachments/` - List attachments
- `POST /api/v1/attachments/` - Create attachment
- `POST /api/v1/attachments/upload/` - Upload file

#### Attachment Details
- `GET /api/v1/attachments/{id}/` - Get attachment details
- `PUT /api/v1/attachments/{id}/` - Update attachment
- `DELETE /api/v1/attachments/{id}/` - Delete attachment

#### Attachment Actions
- `GET /api/v1/attachments/{id}/posts/` - Get posts using this attachment
- `GET /api/v1/attachments/orphaned/` - List orphaned attachments
- `DELETE /api/v1/attachments/cleanup_orphaned/` - Cleanup orphaned files (staff only)

## Filtering and Search

### Post Filters
- `search` - Search in title, content, excerpt, meta fields
- `status` - Filter by publication status (draft, published)
- `is_featured` - Filter featured posts
- `is_pinned` - Filter pinned posts
- `author` - Filter by author ID
- `author_username` - Filter by author username
- `created_after/before` - Date range filters
- `published_after/before` - Publication date filters
- `has_attachments` - Posts with/without attachments
- `view_count_min/max` - View count range
- `like_count_min/max` - Like count range

### Attachment Filters
- `search` - Search in name, description, alt_text
- `file_type` - Filter by file type (image, document, etc.)
- `mime_type` - Filter by MIME type
- `is_public` - Filter public/private files
- `uploaded_by` - Filter by uploader
- `uploaded_after/before` - Upload date filters
- `file_size_min/max` - File size range
- `orphaned` - Orphaned attachments filter

## Permissions

### Admin-Only Access
**All CMS operations require admin (staff) privileges.** This includes:

- **Create**: Admin users only
- **Read**: Admin users only 
- **Update**: Admin users only
- **Delete**: Admin users only
- **All Actions**: Admin users only (publish, feature, file management, etc.)

### Permission Check
The CMS uses a custom `IsAdminUser` permission class that requires:
- User must be authenticated (`request.user.is_authenticated`)
- User must be staff (`request.user.is_staff`)

Non-admin users will receive a `403 Forbidden` response when attempting to access any CMS endpoint.

## Data Models

### Post Fields (from existing model)
- `title` - Post title
- `slug` - URL-friendly slug (auto-generated)
- `content` - Post body content
- `excerpt` - Short description
- `status` - Publication status (draft/published)
- `published_at` - Publication timestamp
- `author` - Post author (ForeignKey to User)
- `attachments` - File attachments (ManyToMany)
- `is_featured` - Featured flag
- `is_pinned` - Pinned flag
- `view_count` - View counter
- `like_count` - Like counter
- `meta_title/description/keywords` - SEO fields
- `generic_key` - Set to "post" for CMS posts

### Attachment Fields (from existing model)
- `name` - Attachment name
- `description` - File description
- `file` - File field
- `file_type` - Type classification (image/document)
- `file_size` - File size in bytes
- `mime_type` - MIME type
- `is_public` - Public access flag
- `alt_text` - Alternative text for accessibility
- `uploaded_by` - Uploader (ForeignKey to User)

## Management Commands

### CMS Management Command
```bash
python manage.py cms_manage <action> [--dry-run]
```

#### Available Actions:
- `stats` - Show CMS statistics
- `cleanup` - Remove orphaned attachments
- `create_sample` - Create sample data for testing

#### Examples:
```bash
# Show statistics
python manage.py cms_manage stats

# Clean up orphaned files (dry run first)
python manage.py cms_manage cleanup --dry-run
python manage.py cms_manage cleanup

# Create sample data
python manage.py cms_manage create_sample
```

## Usage Examples

**Note: All examples require admin authentication with a valid admin user token.**

### Creating a Post with Attachments
```bash
# Via API (Admin token required)
curl -X POST /api/v1/posts/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Blog Post", 
    "content": "This is the post content...",
    "excerpt": "A brief description",
    "status": "draft",
    "is_featured": false,
    "attachment_ids": ["uuid1", "uuid2"]
  }'
```

### Publishing a Post
```bash
curl -X POST /api/v1/posts/{id}/publish/ \
  -H "Authorization: Bearer <admin_token>"
```

### Uploading an Attachment
```bash
curl -X POST /api/v1/attachments/upload/ \
  -H "Authorization: Bearer <admin_token>" \
  -F "file=@image.jpg" \
  -F "title=My Image" \
  -F "is_public=true"
```

### Filtering Posts (Admin only)
```bash
# Get featured posts
GET /api/v1/posts/?is_featured=true
Authorization: Bearer <admin_token>

# Search posts  
GET /api/v1/posts/?search=django
Authorization: Bearer <admin_token>

# Get posts by author
GET /api/v1/posts/?author_username=john
Authorization: Bearer <admin_token>
```

### Uploading and Attaching Files
```python
# 1. Upload file
POST /api/v1/attachments/upload/
Content-Type: multipart/form-data
{
    "name": "My Image",
    "file": <file_data>,
    "file_type": "image",
    "is_public": true
}

# 2. Attach to post
POST /api/v1/posts/{post_id}/attach_file/
{
    "attachment_id": "attachment_uuid"
}
```

### Publishing Workflow
```python
# 1. Create draft
POST /api/v1/posts/ {"title": "...", "status": "draft"}

# 2. Publish when ready
POST /api/v1/posts/{id}/publish/
```

## Integration

The CMS app integrates seamlessly with the existing Django project structure:

- **Uses existing models**: Post and Attachment models from `apps.posts` and `apps.attachments`
- **Leverages core permissions**: Uses permission classes from `apps.core.permissions`
- **Follows project patterns**: Consistent with other app structures in the project
- **Minimal overhead**: No new models or complex relationships

## Development Notes

### Key Design Decisions
1. **Reuse existing models** instead of creating new ones
2. **Use `generic_key="post"`** to identify CMS posts
3. **Simplified API** focused on essential CRUD operations
4. **Leverages existing relationships** (User, Post, Attachment)
5. **Maintains compatibility** with existing post functionality

### Future Enhancements
- Category/tag system (if needed)
- Rich text editor integration
- Bulk operations
- Content versioning
- Workflow management
- Content scheduling
