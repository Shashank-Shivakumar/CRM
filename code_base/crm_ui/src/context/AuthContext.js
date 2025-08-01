import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('crm_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          setToken(savedToken);
          fetchUserInfo(savedToken);
        } else {
          localStorage.removeItem('crm_token');
        }
      } catch (error) {
        localStorage.removeItem('crm_token');
      }
    }
    setLoading(false);
  }, []);

  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH_ME, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 User data fetched:', userData);
        setUser(userData);
      } else {
        console.log('❌ Failed to fetch user info:', response.status);
        localStorage.removeItem('crm_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('crm_token');
      setToken(null);
      setUser(null);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('🔐 Attempting Google login...');
      const response = await fetch(API_ENDPOINTS.AUTH_GOOGLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: credentialResponse.credential
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Google login successful:', data);
        localStorage.setItem('crm_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
      } else {
        const errorData = await response.json();
        console.error('❌ Google login failed:', errorData);
        alert(`Google login failed: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google login failed. Please try again.');
    }
  };

  const handleMicrosoftSuccess = async (microsoftResponse) => {
    try {
      console.log('🔐 Attempting Microsoft login...');
      const response = await fetch(API_ENDPOINTS.AUTH_MICROSOFT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: microsoftResponse.accessToken,
          id_token: microsoftResponse.idToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Microsoft login successful:', data);
        localStorage.setItem('crm_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('❌ Microsoft login failed:', errorData);
        alert(`Microsoft login failed: ${errorData.detail}`);
        return { success: false };
      }
    } catch (error) {
      console.error('Microsoft login error:', error);
      alert('Microsoft login failed. Please try again.');
      return { success: false };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('crm_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    const isAdminUser = user?.role === 'admin';
    console.log('👑 isAdmin check:', isAdminUser, 'User role:', user?.role, 'User:', user);
    return isAdminUser;
  };

  const isAgent = () => {
    const isAgentUser = user?.role === 'agent';
    console.log('👤 isAgent check:', isAgentUser, 'User role:', user?.role, 'User:', user);
    return isAgentUser;
  };

  const value = {
    user,
    token,
    loading,
    login: handleGoogleSuccess,
    loginMicrosoft: handleMicrosoftSuccess,
    logout,
    isAdmin,
    isAgent,
    isAuthenticated: !!user
  };

  console.log('🔐 AuthContext state:', { user, token, loading, isAuthenticated: !!user });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const GoogleAuthProvider = ({ children }) => {
  // Use a test client ID for development
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '123456789-abcdefghijklmnop.apps.googleusercontent.com';
  
  console.log('🔐 Google Client ID:', GOOGLE_CLIENT_ID);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}; 