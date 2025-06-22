"""
CMS Management Command - Post Management

This command provides various operations for managing CMS posts using existing Post model.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.posts.models import Post
from apps.attachments.models import Attachment
from apps.core.models import PublicationStatus

User = get_user_model()


class Command(BaseCommand):
    help = 'Manage CMS posts and attachments'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            choices=['cleanup', 'stats', 'create_sample'],
            help='Action to perform'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        action = options['action']
        dry_run = options['dry_run']

        if action == 'cleanup':
            self.cleanup_orphaned_attachments(dry_run)
        elif action == 'stats':
            self.show_stats()
        elif action == 'create_sample':
            self.create_sample_data(dry_run)

    def cleanup_orphaned_attachments(self, dry_run=False):
        """Remove orphaned attachment files"""
        self.stdout.write("Checking for orphaned attachment files...")
        
        orphaned_attachments = Attachment.objects.filter(posts__isnull=True)
        count = orphaned_attachments.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No orphaned attachment files found."))
            return
        
        self.stdout.write(f"Found {count} orphaned attachment files:")
        
        for attachment in orphaned_attachments:
            self.stdout.write(f"  - {attachment.name} ({attachment.file_size_human})")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: No files were deleted."))
        else:
            # Delete the files
            for attachment in orphaned_attachments:
                if attachment.file:
                    attachment.file.delete()
                attachment.delete()
            
            self.stdout.write(
                self.style.SUCCESS(f"Successfully deleted {count} orphaned attachment files.")
            )

    def show_stats(self):
        """Show CMS statistics"""
        self.stdout.write("CMS Statistics:")
        self.stdout.write("=" * 50)
          # Post stats (all posts)
        all_posts = Post.objects.all()
        total_posts = all_posts.count()
        published_posts = all_posts.filter(status=PublicationStatus.PUBLISHED).count()
        draft_posts = all_posts.filter(status=PublicationStatus.DRAFT).count()
        featured_posts = all_posts.filter(is_featured=True).count()
        
        self.stdout.write(f"Posts:")
        self.stdout.write(f"  Total: {total_posts}")
        self.stdout.write(f"  Published: {published_posts}")
        self.stdout.write(f"  Drafts: {draft_posts}")
        self.stdout.write(f"  Featured: {featured_posts}")
        
        # Attachment stats
        total_attachments = Attachment.objects.count()
        public_attachments = Attachment.objects.filter(is_public=True).count()
        private_attachments = Attachment.objects.filter(is_public=False).count()
        orphaned_attachments = Attachment.objects.filter(posts__isnull=True).count()
        
        self.stdout.write(f"\nAttachments:")
        self.stdout.write(f"  Total: {total_attachments}")
        self.stdout.write(f"  Public: {public_attachments}")
        self.stdout.write(f"  Private: {private_attachments}")
        self.stdout.write(f"  Orphaned: {orphaned_attachments}")
        
        # Attachment by type
        self.stdout.write("\nAttachments by Type:")
        attachment_types = Attachment.objects.values_list('file_type', flat=True).distinct()
        for attachment_type in attachment_types:
            count = Attachment.objects.filter(file_type=attachment_type).count()
            self.stdout.write(f"  {attachment_type.title()}: {count}")
          # Authors
        authors = all_posts.values_list('author', flat=True).distinct()
        self.stdout.write(f"\nActive Authors: {len(authors)}")

    def create_sample_data(self, dry_run=False):
        """Create sample data for testing"""
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN: No data will be created."))
            return
        
        self.stdout.write("Creating sample CMS data...")
        
        # Get or create a user
        try:
            user = User.objects.filter(is_staff=True).first()
            if not user:
                user = User.objects.create_user(
                    email='admin@example.com',
                    username='admin',
                    password='admin123',
                    is_staff=True,
                    is_superuser=True
                )
                self.stdout.write("Created admin user: admin@example.com / admin123")
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating user: {e}")
            )
            return
        
        # Create sample posts
        posts_data = [
            {
                'title': 'Getting Started with Django REST Framework',
                'excerpt': 'Learn how to build powerful APIs with Django REST Framework.',
                'content': '''
                Django REST Framework (DRF) is a powerful and flexible toolkit for building Web APIs.
                
                ## Installation
                
                First, install Django REST Framework:
                
                ```bash
                pip install djangorestframework
                ```
                
                ## Basic Setup
                
                Add it to your INSTALLED_APPS:
                
                ```python
                INSTALLED_APPS = [
                    ...
                    'rest_framework',
                ]
                ```
                
                ## Creating Your First API
                
                Let's create a simple API for a blog post model...
                ''',
                'status': PublicationStatus.PUBLISHED,
                'is_featured': True,
                'meta_title': 'Django REST Framework Tutorial',
                'meta_description': 'Complete guide to getting started with Django REST Framework'
            },
            {
                'title': 'Python Best Practices for 2025',
                'excerpt': 'Discover the latest Python best practices and patterns.',
                'content': '''
                Python continues to evolve, and with it, our best practices.
                
                ## Code Organization
                
                1. Use virtual environments
                2. Follow PEP 8 style guide
                3. Write comprehensive tests
                4. Document your code
                
                ## Performance Tips
                
                1. Use list comprehensions appropriately
                2. Leverage built-in functions
                3. Profile your code
                4. Consider async/await for I/O operations
                ''',
                'status': PublicationStatus.PUBLISHED,
                'is_featured': False,
                'meta_title': 'Python Best Practices 2025',
                'meta_description': 'Latest Python best practices and coding patterns'
            },
            {
                'title': 'Building Scalable Web Applications',
                'excerpt': 'Architecture patterns for building scalable web applications.',
                'content': '''
                Building scalable web applications requires careful planning and architecture.
                
                ## Key Principles
                
                1. **Separation of Concerns**: Keep different aspects of your application separate
                2. **Stateless Design**: Make your application stateless where possible
                3. **Caching Strategy**: Implement effective caching at multiple levels
                4. **Database Optimization**: Design efficient database schemas and queries
                
                ## Architecture Patterns
                
                - Microservices
                - Event-driven architecture
                - CQRS (Command Query Responsibility Segregation)
                - Domain-driven design
                ''',
                'status': PublicationStatus.DRAFT,
                'is_featured': False,
                'meta_title': 'Scalable Web Application Architecture',
                'meta_description': 'Guide to building scalable web applications'
            }        ]
        
        for post_info in posts_data:
            # Create post
            post, created = Post.objects.get_or_create(
                title=post_info['title'],
                defaults={
                    **post_info, 
                    'author': user
                }
            )
            
            if created:
                self.stdout.write(f"Created post: {post.title}")
                
                # Add published_at for published posts
                if post.status == PublicationStatus.PUBLISHED:
                    post.published_at = timezone.now()
                    post.save()
        
        self.stdout.write(
            self.style.SUCCESS("Sample data created successfully!")
        )
