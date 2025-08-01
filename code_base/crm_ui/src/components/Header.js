import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAdmin, isAgent } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  console.log('🔍 Header render:', { 
    user, 
    isAdmin: isAdmin(), 
    isAgent: isAgent(), 
    showUserMenu 
  });

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    logout();
    navigate('/properties');
    setShowUserMenu(false);
  };

  const handleNavigation = (path) => {
    console.log(`🧭 Navigating to: ${path}`);
    setShowUserMenu(false);
    navigate(path);
  };

  const handleSignInClick = () => {
    console.log('🔐 Sign In button clicked');
  };

  const handleUserMenuClick = () => {
    console.log('👤 User menu button clicked, current state:', showUserMenu);
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="bg-white shadow-sm border-b relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/properties" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Real Estate CRM</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/properties" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
            >
              Properties
            </Link>
            
            {/* Show additional nav items for authenticated users */}
            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  Dashboard
                </Link>
                
                {isAdmin() && (
                  <>
                    <Link 
                      to="/admin" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                    >
                      Admin Panel
                    </Link>
                    <Link 
                      to="/crm" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                    >
                      CRM
                    </Link>
                  </>
                )}
                
                {isAgent() && (
                  <>
                    <Link 
                      to="/agent" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                    >
                      Agent Panel
                    </Link>
                    <Link 
                      to="/crm" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
                    >
                      CRM
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Menu / Sign In */}
          <div className="flex items-center space-x-4 relative z-50">
            {user ? (
              /* Authenticated User Menu */
              <div className="relative">
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ zIndex: 1000 }}
                >
                  <div className="flex items-center space-x-2">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">👤</span>
                      </div>
                    )}
                    <div className="text-sm text-left">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isAdmin() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isAdmin() ? 'Admin' : 'Agent'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[9999] border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    
                    <button
                      onClick={() => handleNavigation('/dashboard')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      🏠 Dashboard
                    </button>
                    
                    {isAdmin() && (
                      <button
                        onClick={() => handleNavigation('/admin')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        👑 Admin Panel
                      </button>
                    )}
                    
                    {isAgent() && (
                      <button
                        onClick={() => handleNavigation('/agent')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        👤 Agent Panel
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleNavigation('/crm')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      💼 CRM
                    </button>
                    
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Public User - Sign In Button */
              <Link
                to="/login"
                onClick={handleSignInClick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            console.log('🖱️ Clicking outside dropdown');
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header; 