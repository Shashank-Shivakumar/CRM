# Microsoft Authentication Setup Guide

This guide will help you set up Microsoft authentication for the Real Estate CRM application.

## Prerequisites

1. A Microsoft Azure account
2. Access to Azure Active Directory (Azure AD)
3. Basic knowledge of Azure portal

## Step 1: Register Your Application in Azure AD

### 1.1 Go to Azure Portal
1. Navigate to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft account

### 1.2 Register New Application
1. Search for "Azure Active Directory" in the search bar
2. Click on "Azure Active Directory" from the results
3. In the left sidebar, click on "App registrations"
4. Click "New registration"

### 1.3 Configure Application Registration
Fill in the following details:

- **Name**: `Real Estate CRM` (or your preferred name)
- **Supported account types**: 
  - Choose "Accounts in any organizational directory and personal Microsoft accounts" for multi-tenant
  - Choose "Accounts in this organizational directory only" for single-tenant
- **Redirect URI**: 
  - Type: `Single-page application (SPA)`
  - URI: `http://localhost:3000` (for development)
  - Add additional URIs for production: `https://yourdomain.com`

### 1.4 Get Application Credentials
After registration:
1. Note down the **Application (client) ID** - this is your `MICROSOFT_CLIENT_ID`
2. Go to "Certificates & secrets" in the left sidebar
3. Click "New client secret"
4. Add a description and choose expiration
5. Copy the generated secret value - this is your `MICROSOFT_CLIENT_SECRET`

## Step 2: Configure API Permissions

### 2.1 Add Microsoft Graph Permissions
1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add the following permissions:
   - `User.Read` (to read user profile)
   - `email` (to get email address)
   - `profile` (to get profile information)
   - `openid` (for OpenID Connect)

### 2.2 Grant Admin Consent
1. Click "Grant admin consent" button
2. Confirm the permissions

## Step 3: Update Environment Variables

### 3.1 Frontend Configuration
Update `code_base/crm_ui/.env`:
```env
REACT_APP_MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
```

### 3.2 Backend Configuration
Update `code_base/crm_api/.env`:
```env
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here
MICROSOFT_TENANT_ID=common
```

## Step 4: Install Dependencies

### 4.1 Frontend Dependencies
The following packages have been added:
- `@azure/msal-browser`: Microsoft Authentication Library for browser
- `@azure/msal-react`: React wrapper for MSAL

### 4.2 Backend Dependencies
The following package has been added:
- `msal`: Microsoft Authentication Library for Python

## Step 5: Test the Integration

### 5.1 Start the Application
1. Start the backend server:
   ```bash
   cd code_base/crm_api
   python main.py
   ```

2. Start the frontend application:
   ```bash
   cd code_base/crm_ui
   npm start
   ```

### 5.2 Test Microsoft Login
1. Navigate to the login page
2. Click "Sign in with Microsoft"
3. Complete the Microsoft authentication flow
4. Verify that you're redirected to the dashboard

## Step 6: Production Deployment

### 6.1 Update Redirect URIs
For production deployment, add your production domain to the redirect URIs in Azure AD:
- `https://yourdomain.com`
- `https://www.yourdomain.com`

### 6.2 Environment Variables
Update the environment variables in your production environment with the actual Microsoft credentials.

### 6.3 CORS Configuration
Ensure your backend CORS configuration includes your production domain.

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Verify your `MICROSOFT_CLIENT_ID` is correct
   - Ensure the application is properly registered in Azure AD

2. **"Redirect URI mismatch" error**
   - Check that the redirect URI in Azure AD matches your application URL
   - For development, use `http://localhost:3000`
   - For production, use your actual domain

3. **"Insufficient permissions" error**
   - Ensure all required permissions are granted in Azure AD
   - Check that admin consent has been granted

4. **"Token validation failed" error**
   - Verify your `MICROSOFT_CLIENT_SECRET` is correct
   - Check that the secret hasn't expired

### Debug Mode
Enable debug logging by setting the following environment variable:
```env
REACT_APP_DEBUG=true
```

## Security Considerations

1. **Client Secrets**: Never commit client secrets to version control
2. **Redirect URIs**: Only add trusted domains to redirect URIs
3. **Permissions**: Only request the minimum permissions needed
4. **Token Storage**: Tokens are stored in sessionStorage for security
5. **HTTPS**: Always use HTTPS in production

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Azure AD configuration is complete
4. Check the backend logs for authentication errors
