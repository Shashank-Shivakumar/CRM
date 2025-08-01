import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/msalConfig';

const MicrosoftLogin = ({ onSuccess, onError }) => {
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    try {
      console.log('🔐 Starting Microsoft login via popup...');
      const response = await instance.loginPopup(loginRequest);

      console.log('🔐 Popup login response:', response);

      const graphResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: response.account,
      });

      console.log('🔐 Graph token acquired:', graphResponse);

      // Call your AuthContext's loginMicrosoft handler
      onSuccess({
        accessToken: graphResponse.accessToken,
        idToken: response.idToken,
        account: response.account,
      });

    } catch (error) {
      console.error('❌ Microsoft login error:', error);

      let errorMessage = 'Microsoft login failed. Please try again.';
      if (error.errorCode === 'popup_window_error') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.errorCode === 'user_cancelled') {
        errorMessage = 'Login was cancelled.';
      }

      onError(new Error(errorMessage));
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        handleMicrosoftLogin();
      }}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.5 2.75h-8a.75.75 0 0 0-.75.75v8c0 .414.336.75.75.75h8a.75.75 0 0 0 .75-.75v-8a.75.75 0 0 0-.75-.75zm-8 1.5h6.5v6.5h-6.5v-6.5zm8 1.5h8a.75.75 0 0 1 .75.75v8a.75.75 0 0 1-.75.75h-8a.75.75 0 0 1-.75-.75v-8a.75.75 0 0 1 .75-.75zm8 1.5h-6.5v6.5h6.5v-6.5z"/>
      </svg>
      Sign in with Microsoft
    </button>
  );
};

export default MicrosoftLogin;
