from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.attachments.models import Attachment
from .models import Post, PostTag, PostComment, PostLike

User = get_user_model()


class PostModelTest(TestCase):
    """Test cases for Post model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            firebase_uid='test_uid'
        )
        self.tag = PostTag.objects.create(name='Test Tag')
    
    def test_post_creation(self):
        """Test post creation with required fields"""
        post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        
        self.assertEqual(post.title, 'Test Post')
        self.assertEqual(post.author, self.user)
        self.assertEqual(post.status, 'draft')
        self.assertIsNotNone(post.slug)
        self.assertFalse(post.is_published)
    
    def test_post_slug_generation(self):
        """Test automatic slug generation"""
        post = Post.objects.create(
            title='Test Post Title',
            content='Test content',
            author=self.user
        )
        
        self.assertEqual(post.slug, 'test-post-title')
    
    def test_post_publish(self):
        """Test post publishing"""
        post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        
        self.assertFalse(post.is_published)
        self.assertIsNone(post.published_at)
        
        post.publish()
        
        self.assertTrue(post.is_published)
        self.assertIsNotNone(post.published_at)
        self.assertEqual(post.status, 'published')
    
    def test_post_managers(self):
        """Test custom managers"""
        # Create published and draft posts
        published_post = Post.objects.create(
            title='Published Post',
            content='Content',
            author=self.user,
            status='published'
        )
        draft_post = Post.objects.create(
            title='Draft Post',
            content='Content',
            author=self.user,
            status='draft'
        )
        
        self.assertEqual(Post.objects.published().count(), 1)
        self.assertEqual(Post.objects.drafts().count(), 1)
        self.assertEqual(Post.objects.by_author(self.user).count(), 2)


class PostTagModelTest(TestCase):
    """Test cases for PostTag model"""
    
    def test_tag_creation(self):
        """Test tag creation"""
        tag = PostTag.objects.create(name='Django')
        
        self.assertEqual(tag.name, 'Django')
        self.assertEqual(tag.slug, 'django')
    
    def test_tag_slug_generation(self):
        """Test automatic slug generation for tags"""
        tag = PostTag.objects.create(name='Web Development')
        
        self.assertEqual(tag.slug, 'web-development')


class PostCommentModelTest(TestCase):
    """Test cases for PostComment model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            firebase_uid='test_uid'
        )
        self.post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
    
    def test_comment_creation(self):
        """Test comment creation"""
        comment = PostComment.objects.create(
            post=self.post,
            author=self.user,
            content='Test comment'
        )
        
        self.assertEqual(comment.post, self.post)
        self.assertEqual(comment.author, self.user)
        self.assertEqual(comment.content, 'Test comment')
        self.assertTrue(comment.is_approved)
    
    def test_nested_comments(self):
        """Test nested comment functionality"""
        parent_comment = PostComment.objects.create(
            post=self.post,
            author=self.user,
            content='Parent comment'
        )
        
        child_comment = PostComment.objects.create(
            post=self.post,
            author=self.user,
            content='Child comment',
            parent=parent_comment
        )
        
        self.assertEqual(child_comment.parent, parent_comment)
        self.assertIn(child_comment, parent_comment.replies.all())


class PostLikeModelTest(TestCase):
    """Test cases for PostLike model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            firebase_uid='test_uid'
        )
        self.post = Post.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
    
    def test_like_creation(self):
        """Test like creation"""
        like = PostLike.objects.create(
            post=self.post,
            user=self.user
        )
        
        self.assertEqual(like.post, self.post)
        self.assertEqual(like.user, self.user)
    
    def test_unique_like_constraint(self):
        """Test that user can't like the same post twice"""
        PostLike.objects.create(post=self.post, user=self.user)
        
        with self.assertRaises(Exception):
            PostLike.objects.create(post=self.post, user=self.user)
