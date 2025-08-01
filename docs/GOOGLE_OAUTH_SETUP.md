# 🔐 Google OAuth Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for the Real Estate CRM application.

## 📋 Prerequisites

- Google Cloud Console account
- Access to create OAuth 2.0 credentials
- Basic understanding of OAuth flow

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Real Estate CRM")
   - Click "Create"

### 2. Enable Required APIs

1. **Navigate to APIs & Services**
   - Go to APIs & Services > Library

2. **Enable Google+ API**
   - Search for "Google+ API"
   - Click on it and press "Enable"

3. **Enable Google OAuth2 API**
   - Search for "Google OAuth2 API"
   - Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to APIs & Services > Credentials

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials"
   - Select "OAuth 2.0 Client IDs"

3. **Configure OAuth Consent Screen**
   - If prompted, configure the consent screen:
     - **User Type**: External
     - **App Name**: Real Estate CRM
     - **User Support Email**: Your email
     - **Developer Contact Information**: Your email
   - Click "Save and Continue"

4. **Create OAuth 2.0 Client ID**
   - **Application Type**: Web application
   - **Name**: Real Estate CRM Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://localhost:3001
     http://127.0.0.1:3000
     http://127.0.0.1:3001
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000
     http://localhost:3000/
     http://localhost:3001
     http://localhost:3001/
     ```
   - Click "Create"

### 4. Copy Credentials

After creating the OAuth 2.0 Client ID, you'll see:
- **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**⚠️ Important**: Keep these credentials secure and never commit them to version control.

### 5. Update Environment Variables

#### Backend Configuration (`code_base/crm_api/.env`)

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Database Configuration (existing)
CLOUD_POSTGRES_HOST=your_host
CLOUD_POSTGRES_PORT=your_port
CLOUD_POSTGRES_USER=your_username
CLOUD_POSTGRES_PASSWORD=your_password
CLOUD_POSTGRES_DB=your_database
USE_CLOUD_DB=true
```

#### Frontend Configuration (`code_base/crm_ui/.env`)

```bash
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-client-id-here

# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

### 6. Generate JWT Secret Key

For production, generate a secure JWT secret key:

```bash
# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Or using OpenSSL
openssl rand -base64 32
```

## 🔧 Testing the Setup

### 1. Start the Services

```bash
# Backend
cd code_base/crm_api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd ../crm_ui
npm start
```

### 2. Test the Authentication

1. **Open the application**: http://localhost:3000
2. **Click "Sign In"** in the top right corner
3. **Complete Google OAuth flow**
4. **Verify you're redirected to dashboard**

### 3. Check API Endpoints

Test the authentication endpoints:

```bash
# Test Google OAuth endpoint
curl -X POST http://localhost:8000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token":"test"}'

# Should return 401 (expected for test token)
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Error 401: invalid_client"
**Cause**: Incorrect Google Client ID or missing redirect URIs
**Solution**:
- Verify Client ID in both frontend and backend `.env` files
- Check that redirect URIs are correctly configured in Google Cloud Console
- Ensure the Client ID matches exactly

#### 2. "Error 400: origin_mismatch"
**Cause**: Frontend origin not in authorized JavaScript origins
**Solution**:
- Add your frontend URL to authorized JavaScript origins in Google Cloud Console
- Include both `http://localhost:3000` and `http://localhost:3001`

#### 3. "Error 400: redirect_uri_mismatch"
**Cause**: Redirect URI not in authorized redirect URIs
**Solution**:
- Add your redirect URIs to authorized redirect URIs in Google Cloud Console
- Include both with and without trailing slash

#### 4. "ModuleNotFoundError: No module named 'httpx'"
**Cause**: Missing Python dependencies
**Solution**:
```bash
cd code_base/crm_api
pip install httpx
```

#### 5. "jwt-decode does not contain a default export"
**Cause**: Wrong import syntax for jwt-decode
**Solution**:
- Use `import { jwtDecode } from 'jwt-decode'` instead of `import jwt_decode from 'jwt-decode'`

### Environment Variable Issues

#### Check Environment Variables

```bash
# Backend
cd code_base/crm_api
cat .env

# Frontend
cd ../crm_ui
cat .env
```

#### Verify Google Client ID

Make sure the Client ID is the same in both:
- Google Cloud Console
- Backend `.env` file
- Frontend `.env` file

### Database Issues

#### Check Database Connection

```bash
cd code_base/crm_api
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('Database URL:', os.getenv('CLOUD_POSTGRES_HOST'))
"
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development and production
- Rotate secrets regularly

### 2. Google OAuth Configuration
- Use HTTPS in production
- Add production domains to authorized origins
- Monitor OAuth usage in Google Cloud Console

### 3. JWT Security
- Use strong, random JWT secret keys
- Set appropriate token expiration times
- Implement token refresh mechanisms

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [React OAuth Libraries](https://github.com/MomenSherif/react-oauth)

## 🆘 Getting Help

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Verify all environment variables are set correctly**
3. **Test with the provided curl commands**
4. **Check Google Cloud Console for any errors**
5. **Review the application logs for detailed error messages**

---

**Need more help?** Check the main README.md file or open an issue in the repository. 