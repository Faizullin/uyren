# API Permissions and Views Implementation Summary

## Overview
This document outlines the comprehensive permissions system and REST API views implemented across all apps in the Uyren backend project.

## Core Permissions (apps/core/permissions.py)

### Custom Permission Classes

1. **IsAuthenticated** - Enhanced version with better error messages
2. **IsOwnerOrReadOnly** - Allows owners to edit, others to read (if authenticated)
3. **IsOwner** - Only allows owners to access the resource
4. **IsAdminOrReadOnly** - Admins can edit, authenticated users can read
5. **IsVerifiedUser** - Only verified users can access
6. **CanPublishPost** - Only verified users or staff can publish posts
7. **IsAuthorOrReadOnly** - Authors can edit their posts, others can read published posts
8. **IsSelfOrReadOnly** - Users can edit their own profile, read others
9. **CanAccessAttachment** - Complex logic for attachment access based on ownership and linked content

## Apps API Implementation

### 1. Accounts App (apps/accounts/api/)

#### Views:
- **UserViewSet** (ModelViewSet)
  - `list` - Admin only (IsAdminOrReadOnly)
  - `retrieve` - Self or read-only (IsSelfOrReadOnly)
  - `update/partial_update` - Self only (IsSelfOrReadOnly)
  - `destroy` - Self only (soft delete via deactivation)
  - `me` - Get current user profile (IsAuthenticated)
  - `update_profile` - Update current user (IsAuthenticated)

#### Additional Endpoints:
- `firebase_auth` - Firebase token authentication (AllowAny)
- `logout` - User logout (IsAuthenticated)
- `user_stats` - User statistics (IsAuthenticated)

#### Features:
- Firebase authentication integration
- Soft delete (deactivation)
- Profile management
- User statistics
- Search and filtering capabilities

### 2. Posts App (apps/posts/api/)

#### Views:
- **PostViewSet** (ModelViewSet)
  - `list` - Public for published posts, authenticated users see their own + published
  - `retrieve` - Same as list
  - `create` - Authenticated + CanPublishPost
  - `update/partial_update` - Author only + CanPublishPost
  - `destroy` - Author only
  - `my_posts` - Current user's posts (IsAuthenticated)
  - `drafts` - Current user's drafts (IsAuthenticated)
  - `featured` - Featured published posts (Public)
  - `like` - Like a post (IsAuthenticated)
  - `view` - Increment view count (Public)
  - `publish` - Publish a draft (IsAuthenticated + IsAuthorOrReadOnly)
  - `unpublish` - Unpublish a post (IsAuthenticated + IsAuthorOrReadOnly)

#### Features:
- Publication status management
- Attachment linking
- View and like tracking
- Advanced filtering and search
- Author-based access control
- Automatic publication timestamp management

### 3. Attachments App (apps/attachments/api/)

#### Views:
- **AttachmentViewSet** (ModelViewSet)
  - `list` - Authenticated users see their own + public attachments
  - `retrieve` - Complex access control via CanAccessAttachment
  - `create` - Authenticated users only
  - `update/partial_update` - Owner only
  - `destroy` - Owner only
  - `my_attachments` - Current user's attachments (IsAuthenticated)
  - `images` - Image attachments (IsAuthenticated)
  - `documents` - Document attachments (IsAuthenticated)
  - `bulk_upload` - Upload multiple files (IsAuthenticated)
  - `attach_to_object` - Attach file to object (IsAuthenticated + IsOwnerOrReadOnly)
  - `detach_from_object` - Detach file from object (IsAuthenticated + IsOwnerOrReadOnly)

#### Additional Endpoints:
- `attachment_stats` - User attachment statistics (IsAuthenticated)

#### Features:
- File upload with validation
- Bulk upload support
- Generic object linking
- File type detection
- Size validation
- Access control based on linked content

### 4. Core App (apps/core/api/)

#### Views:
- `health_check` - System health status (AllowAny)
- `api_info` - API information for authenticated users (IsAuthenticated)
- `dashboard_stats` - User dashboard statistics (IsAuthenticated)
- `admin_stats` - Admin-only system statistics (IsAdminUser)
- `publication_status_choices` - Available status choices (AllowAny)
- `report_issue` - Report bugs/issues (IsAuthenticated)
- `system_status` - System status check (AllowAny)

## Permission Logic Summary

### Access Patterns:

1. **Public Access**:
   - Health checks
   - Published post listings
   - Published post details
   - System status

2. **Authenticated Only**:
   - User profiles (read)
   - Draft posts (own only)
   - Attachments (own + public)
   - API information
   - Issue reporting

3. **Owner/Author Only**:
   - Edit own posts
   - Delete own posts
   - Edit own attachments
   - Profile updates

4. **Verified Users**:
   - Publish posts
   - Enhanced features

5. **Admin/Staff**:
   - User management
   - System statistics
   - Override permissions

### Security Features:

1. **Authentication Required**: Most endpoints require authentication
2. **Owner Validation**: Users can only modify their own content
3. **Publication Control**: Only verified users can publish content
4. **File Security**: Attachment access based on linked content visibility
5. **Soft Deletes**: User accounts are deactivated, not deleted
6. **Input Validation**: Comprehensive serializer validation
7. **File Validation**: Size and type restrictions on uploads

### Error Handling:

- Custom permission error messages
- Comprehensive validation error responses
- Graceful handling of missing resources
- Proper HTTP status codes

## Database Relationships and Security:

1. **Posts**: Linked to authors, can have multiple attachments
2. **Attachments**: Generic foreign keys for flexible linking
3. **Users**: Firebase UID integration, verification status
4. **Publication Status**: Controlled via TextChoices in core

## API Features:

1. **Filtering**: Advanced filtering on all major endpoints
2. **Search**: Text search across relevant fields
3. **Ordering**: Customizable ordering options
4. **Pagination**: Built-in pagination support
5. **Bulk Operations**: Bulk upload for attachments
6. **Statistics**: User and admin statistics endpoints
7. **File Management**: Complete file lifecycle management

This implementation provides a robust, secure, and feature-rich API with fine-grained permission control suitable for a modern content management system.
