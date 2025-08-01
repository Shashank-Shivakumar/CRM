# Microsoft Authentication Troubleshooting Guide

If you're experiencing issues with Microsoft authentication, follow this troubleshooting guide.

## Common Issues and Solutions

### 1. "Microsoft login failed. Please try again."

**Possible Causes:**
- Azure AD app registration not properly configured
- Incorrect client ID or redirect URI
- Missing API permissions
- Popup blocked by browser

**Solutions:**

#### Check Azure AD Configuration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Find your app and verify:
   - **Application (client) ID** matches `REACT_APP_MICROSOFT_CLIENT_ID`
   - **Redirect URIs** include `http://localhost:3000` (for development)
   - **Supported account types** is set correctly

#### Check API Permissions
1. In your app registration, go to "API permissions"
2. Ensure these permissions are added and granted:
   - `User.Read` (Delegated)
   - `email` (Delegated)
   - `profile` (Delegated)
   - `openid` (Delegated)
3. Click "Grant admin consent" if not already done

#### Check Environment Variables
Verify your `.env` files have the correct values:

**Frontend (`code_base/crm_ui/.env`):**
```env
REACT_APP_MICROSOFT_CLIENT_ID=bdb4f872-4273-4d7a-9cce-dfbf8ec6a7be
```

**Backend (`code_base/crm_api/.env`):**
```env
MICROSOFT_CLIENT_ID=bdb4f872-4273-4d7a-9cce-dfbf8ec6a7be
MICROSOFT_CLIENT_SECRET=8e8b6696-ef2a-4ec5-bc74-1f7777cbc716
MICROSOFT_TENANT_ID=3d5e0531-dca7-4b95-b5f2-19826e735917
```

### 2. "Popup blocked" Error

**Solution:**
1. Allow popups for `localhost:3000`
2. Try using a different browser
3. Check if any ad blockers are interfering

### 3. "Invalid client" Error

**Solution:**
1. Verify the client ID is correct in both frontend and backend
2. Ensure the app is properly registered in Azure AD
3. Check if the app is in the correct tenant

### 4. "Redirect URI mismatch" Error

**Solution:**
1. Add `http://localhost:3000` to redirect URIs in Azure AD
2. For production, add your actual domain
3. Ensure the URI type is "Single-page application (SPA)"

### 5. "Insufficient permissions" Error

**Solution:**
1. Grant admin consent for all required permissions
2. Ensure the user has the necessary permissions in Azure AD
3. Check if the app requires admin consent

## Debugging Steps

### 1. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try Microsoft login
4. Look for error messages starting with 🔐

### 2. Check Backend Logs
1. Start the backend server
2. Try Microsoft login
3. Check terminal output for error messages

### 3. Test Azure AD Configuration
1. Go to Azure Portal > App registrations
2. Select your app
3. Go to "Authentication"
4. Test the redirect URI manually

## Quick Fix Checklist

- [ ] Azure AD app is properly registered
- [ ] Client ID is correct in both frontend and backend
- [ ] Redirect URI includes `http://localhost:3000`
- [ ] API permissions are granted with admin consent
- [ ] Environment variables are set correctly
- [ ] No popup blockers are active
- [ ] Backend server is running
- [ ] Frontend is running on `http://localhost:3000`

## Testing the Configuration

### 1. Test Frontend Configuration
Add this to your browser console to test the MSAL configuration:
```javascript
console.log('MSAL Config:', window.msalConfig);
console.log('Client ID:', process.env.REACT_APP_MICROSOFT_CLIENT_ID);
```

### 2. Test Backend Configuration
Check if the backend can read the environment variables:
```python
import os
print("Microsoft Client ID:", os.getenv("MICROSOFT_CLIENT_ID"))
print("Microsoft Tenant ID:", os.getenv("MICROSOFT_TENANT_ID"))
```

## Common Azure AD Issues

### 1. App Registration Not Found
- Ensure you're in the correct Azure AD tenant
- Check if the app was deleted or moved

### 2. Permission Denied
- Ensure you have admin rights to grant permissions
- Check if the app requires admin consent

### 3. Token Validation Failed
- Verify the client secret is correct
- Check if the secret has expired
- Ensure the tenant ID is correct

## Getting Help

If you're still experiencing issues:

1. **Check the logs** - Look for specific error messages
2. **Verify Azure AD setup** - Follow the setup guide step by step
3. **Test with a simple app** - Create a minimal test to isolate the issue
4. **Contact Azure support** - If it's an Azure AD configuration issue

## Emergency Fallback

If Microsoft authentication continues to fail, you can:

1. **Use Google authentication** - It's already working
2. **Create a test user** - Add your email to the admin list in `auth_utils.py`
3. **Disable Microsoft auth temporarily** - Comment out the Microsoft login button

## Environment-Specific Issues

### Development Environment
- Use `http://localhost:3000` as redirect URI
- Ensure both frontend and backend are running
- Check for CORS issues

### Production Environment
- Use your actual domain as redirect URI
- Ensure HTTPS is configured
- Update CORS settings in backend 