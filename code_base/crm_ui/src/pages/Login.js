import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import MicrosoftLogin from '../components/MicrosoftLogin';

const Login = () => {
  const { login, loginMicrosoft, loading } = useAuth(); // ✅ Correctly inside the component
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    await login(credentialResponse);
    navigate('/dashboard');
  };

  const handleGoogleError = () => {
    alert('Google login failed. Please try again.');
  };

  const handleMicrosoftSuccess = async (microsoftResponse) => {
    await loginMicrosoft(microsoftResponse);
    navigate('/dashboard');
  };

  const handleMicrosoftError = (error) => {
    console.error('Microsoft login error:', error);
    alert(error.message || 'Microsoft login failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Real Estate CRM
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Welcome Back
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Sign in with your account to access the CRM
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="filled_blue"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <MicrosoftLogin
                onSuccess={handleMicrosoftSuccess}
                onError={handleMicrosoftError}
              />

              {/* Debug button */}
              <button
                onClick={() => {
                  console.log('🔍 Debug: Current URL:', window.location.href);
                  console.log('🔍 Debug: URL search:', window.location.search);
                  console.log('🔍 Debug: URL hash:', window.location.hash);
                  alert('Check console for debug info');
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                🔍 Debug: Check URL Parameters
              </button>

              <button
                onClick={() => window.location.href = '/debug-auth'}
                className="w-full px-4 py-2 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                🔍 Go to Debug Auth Page
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our terms of service and privacy policy
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
