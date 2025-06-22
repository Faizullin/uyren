from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.accounts.models import User
from .models import Attachment, AttachmentTag


class AttachmentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            firebase_uid='test_uid',
            password='testpass123'
        )
        
        # Create a test file
        self.test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
    
    def test_create_attachment(self):
        attachment = Attachment.objects.create(
            file=self.test_file,
            uploaded_by=self.user,
            content_type=ContentType.objects.get_for_model(User),
            object_id=self.user.id
        )
        
        self.assertEqual(attachment.uploaded_by, self.user)
        self.assertEqual(attachment.original_filename, 'test_image.jpg')
        self.assertEqual(attachment.file_type, 'image')
        self.assertTrue(attachment.title)  # Should auto-generate
    
    def test_attachment_file_size_human(self):
        attachment = Attachment.objects.create(
            file=self.test_file,
            uploaded_by=self.user,
            file_size=1024,
            content_type=ContentType.objects.get_for_model(User),
            object_id=self.user.id
        )
        
        self.assertEqual(attachment.file_size_human, '1.0 KB')
    
    def test_attachment_is_image(self):
        attachment = Attachment.objects.create(
            file=self.test_file,
            uploaded_by=self.user,
            content_type=ContentType.objects.get_for_model(User),
            object_id=self.user.id
        )
        
        self.assertTrue(attachment.is_image)
        self.assertFalse(attachment.is_document)


class AttachmentTagTest(TestCase):
    def test_create_tag(self):
        tag = AttachmentTag.objects.create(name='Important')
        
        self.assertEqual(tag.name, 'Important')
        self.assertEqual(tag.slug, 'important')
        self.assertEqual(str(tag), 'Important')
