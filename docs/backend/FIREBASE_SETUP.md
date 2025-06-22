# Firebase Setup Guide

This document explains how to set up Firebase authentication for the backend service.

## Quick Setup

1. **Download Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Place the Service Account File**:
   - Rename the downloaded file to `service-account.json`
   - Place it in the `backend/` folder (same level as `manage.py`)
   - The file is already added to `.gitignore` for security

3. **Verify Setup**:
   - The Firebase service will automatically detect and use the file
   - Check the logs for successful initialization message

## Initialization Methods (in order of preference)

The Firebase service tries to initialize in the following order:

1. **service-account.json file** (recommended)
   - Path: `backend/service-account.json`
   - Automatically detected and used if present

2. **Default credentials** (for production with IAM)
   - Uses Google Cloud default credentials
   - Suitable for deployment on Google Cloud Platform

## Security Notes

- ⚠️ **Never commit service account files to version control**
- The `service-account.json` file is already in `.gitignore`
- Rotate service account keys regularly
- Use IAM roles for production deployments on Google Cloud

## Example Service Account JSON Structure

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Troubleshooting

- **Import errors**: Make sure `firebase-admin` is installed (`pip install firebase-admin`)
- **Permission errors**: Verify the service account has the necessary permissions
- **File not found**: Check that `service-account.json` is in the correct location
- **Invalid JSON**: Validate your service account JSON file format

For more information, see the [Firebase Admin SDK documentation](https://firebase.google.com/docs/admin/setup).
