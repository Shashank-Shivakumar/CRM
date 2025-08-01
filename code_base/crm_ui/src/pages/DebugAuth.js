import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';

const DebugAuth = () => {
  const { user, token, loading, isAuthenticated, loginMicrosoft } = useAuth();
  const { instance, accounts } = useMsal();
  const [msalInfo, setMsalInfo] = useState({});
  const [redirectStatus, setRedirectStatus] = useState('');

  useEffect(() => {
    const getMsalInfo = async () => {
      try {
        const currentAccount = instance.getActiveAccount();
        const allAccounts = instance.getAllAccounts();
        
        setMsalInfo({
          currentAccount: currentAccount ? {
            name: currentAccount.name,
            username: currentAccount.username,
            homeAccountId: currentAccount.homeAccountId
          } : null,
          allAccounts: allAccounts.map(acc => ({
            name: acc.name,
            username: acc.username,
            homeAccountId: acc.homeAccountId
          })),
          accountsLength: allAccounts.length
        });
      } catch (error) {
        console.error('Error getting MSAL info:', error);
      }
    };

    getMsalInfo();
  }, [instance]);

  // Handle redirect response
  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        console.log('🔍 Debug: Checking for redirect response...');
        console.log('🔍 Debug: Current URL:', window.location.href);
        console.log('🔍 Debug: URL search:', window.location.search);
        console.log('🔍 Debug: URL hash:', window.location.hash);
        
        const response = await instance.handleRedirectPromise();
        
        if (response) {
          console.log('🔍 Debug: Redirect response received:', response);
          setRedirectStatus('Redirect response received');
          
          // Get the access token for Microsoft Graph
          let graphResponse;
          try {
            graphResponse = await instance.acquireTokenSilent({
              ...loginRequest,
              account: response.account
            });
          } catch (graphError) {
            console.log('🔍 Debug: Silent token acquisition failed, trying interactive...', graphError);
            graphResponse = await instance.acquireTokenPopup(loginRequest);
          }
          
          console.log('🔍 Debug: Graph response:', graphResponse);
          
          // Call the loginMicrosoft function with the token
          await loginMicrosoft({
            accessToken: graphResponse.accessToken,
            account: response.account,
            idToken: response.idToken
          });
          
          setRedirectStatus('Authentication completed successfully!');
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          console.log('🔍 Debug: No redirect response found');
          setRedirectStatus('No redirect response found');
        }
      } catch (error) {
        console.error('🔍 Debug: Error handling redirect:', error);
        setRedirectStatus(`Error: ${error.message}`);
      }
    };

    handleRedirectResponse();
  }, [instance, loginMicrosoft]);

  const handleTestMicrosoftLogin = async () => {
    try {
      console.log('🔍 Testing Microsoft login with redirect...');
      console.log('🔍 Clearing MSAL cache first...');
      instance.clearCache();
      
      // Use loginRedirect instead of loginPopup to avoid hash clearing issues
      await instance.loginRedirect({
        scopes: ["User.Read", "email", "profile", "openid"]
      });
      console.log('🔍 Redirect initiated successfully');
    } catch (error) {
      console.error('🔍 Microsoft login error:', error);
      alert(`Microsoft login failed: ${error.message}`);
    }
  };

  const handleClearCache = () => {
    instance.clearCache();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Authentication Debug Page
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auth Context Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Auth Context Status
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
                <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
              </div>
            </div>

            {/* MSAL Info */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                MSAL Status
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Active Accounts:</strong> {msalInfo.accountsLength || 0}</p>
                <p><strong>Current Account:</strong> {msalInfo.currentAccount ? msalInfo.currentAccount.username : 'None'}</p>
                <p><strong>All Accounts:</strong> {msalInfo.allAccounts ? msalInfo.allAccounts.length : 0}</p>
              </div>
            </div>
          </div>

          {/* User Details */}
          {user && (
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                ✅ Logged In User Details
              </h2>
              <pre className="bg-white p-3 rounded border text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {/* MSAL Account Details */}
          {msalInfo.currentAccount && (
            <div className="mt-6 bg-purple-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                🔐 MSAL Account Details
              </h2>
              <pre className="bg-white p-3 rounded border text-xs overflow-auto">
                {JSON.stringify(msalInfo.currentAccount, null, 2)}
              </pre>
            </div>
          )}

          {/* Redirect Status */}
          {redirectStatus && (
            <div className="mt-6 bg-orange-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">
                🔄 Redirect Status
              </h2>
              <p className="text-sm">{redirectStatus}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleTestMicrosoftLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔐 Test Microsoft Login (Redirect)
            </button>
            
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ Clear MSAL Cache
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🔄 Go to Login Page
            </button>
          </div>

          {/* Current URL Info */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📍 Current Page Info
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>Search Params:</strong> {window.location.search || 'None'}</p>
              <p><strong>Hash:</strong> {window.location.hash || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth; 