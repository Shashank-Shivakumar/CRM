// import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { MsalProvider, useMsal } from '@azure/msal-react';
// import { PublicClientApplication } from '@azure/msal-browser';
// import './App.css';
// import Properties from './pages/Properties';
// import PropertyDetail from './pages/PropertyDetail';
// import CRM from './pages/CRM';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import AdminDashboard from './pages/AdminDashboard';
// import AgentDashboard from './pages/AgentDashboard';
// import DebugAuth from './pages/DebugAuth';

// import { AuthProvider, useAuth } from './context/AuthContext';
// import { GoogleAuthProvider } from './context/AuthContext';
// import { msalConfig, loginRequest } from './config/msalConfig';
// import './utils/clickTracker'; // Import click tracker

// // Initialize MSAL - ensure we only create one instance
// let msalInstance;
// if (!window.msalInstance) {
//   msalInstance = new PublicClientApplication(msalConfig);
//   window.msalInstance = msalInstance;
// } else {
//   msalInstance = window.msalInstance;
// }

// // Component to handle Microsoft authentication redirects
// // const MicrosoftAuthHandler = () => {
// //   const { instance } = useMsal();
// //   const { loginMicrosoft } = useAuth();
// //   const [isInitialized, setIsInitialized] = useState(false);

// //   useEffect(() => {
// //     const initializeAndHandleRedirect = async () => {
// //       try {
// //         console.log('🔐 Initializing MSAL and handling redirect...');
        
// //         // Wait for MSAL to be ready
// //         await instance.initialize();
// //         setIsInitialized(true);
        
// //         console.log('🔐 MSAL initialized, checking for redirect response...');
// //         console.log('🔐 Current URL:', window.location.href);
// //         console.log('🔐 URL search params:', window.location.search);
// //         console.log('🔐 URL hash:', window.location.hash);
        
// //         // Always try to handle redirect promise, even if we don't see parameters
// //         // MSAL might have stored the response in cache
// //         console.log('🔐 Attempting to handle redirect promise...');
// //         const response = await instance.handleRedirectPromise();
        
// //         if (response) {
// //           console.log('🔐 Microsoft redirect response received:', response);
          
// //           // Get the access token for Microsoft Graph
// //           let graphResponse;
// //           try {
// //             graphResponse = await instance.acquireTokenSilent({
// //               ...loginRequest,
// //               account: response.account
// //             });
// //           } catch (graphError) {
// //             console.log('🔐 Silent token acquisition failed, trying interactive...', graphError);
// //             graphResponse = await instance.acquireTokenPopup(loginRequest);
// //           }
          
// //           console.log('🔐 Graph response:', graphResponse);
          
// //           // Call the loginMicrosoft function with the token
// //           await loginMicrosoft({
// //             accessToken: graphResponse.accessToken,
// //             account: response.account,
// //             idToken: response.idToken
// //           });
          
// //           // Clear the URL parameters and redirect to dashboard
// //           window.history.replaceState({}, document.title, window.location.pathname);
// //           window.location.href = '/dashboard';
// //         } else {
// //           console.log('🔐 No redirect response found');
// //         }
// //       } catch (error) {
// //         console.error('❌ Error handling Microsoft redirect:', error);
// //       }
// //     };

// //     initializeAndHandleRedirect();
// //   }, [instance, loginMicrosoft]);

// //   return null;
// // };

// // Protected Route Component
// const ProtectedRoute = ({ children, requireAdmin = false }) => {
//   const { user, loading, isAdmin } = useAuth();

//   console.log('🔒 ProtectedRoute check:', { user, loading, requireAdmin, isAdmin: isAdmin() });

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     console.log('🔒 No user, redirecting to login');
//     return <Navigate to="/login" replace />;
//   }

//   if (requireAdmin && !isAdmin()) {
//     console.log('🔒 Not admin, redirecting to dashboard');
//     return <Navigate to="/dashboard" replace />;
//   }

//   console.log('🔒 Access granted to protected route');
//   return children;
// };

// // Public Route Component (redirects to dashboard if already logged in)
// const PublicRoute = ({ children }) => {
//   const { user, loading } = useAuth();

//   console.log('🌐 PublicRoute check:', { user, loading });

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (user) {
//     console.log('🌐 User already logged in, redirecting to dashboard');
//     return <Navigate to="/dashboard" replace />;
//   }

//   console.log('🌐 Access granted to public route');
//   return children;
// };

// // Role-based Dashboard Component
// const RoleBasedDashboard = () => {
//   const { isAdmin, isAgent } = useAuth();
  
//   console.log('🎭 RoleBasedDashboard:', { isAdmin: isAdmin(), isAgent: isAgent() });
  
//   if (isAdmin()) {
//     console.log('🎭 Rendering AdminDashboard');
//     return <AdminDashboard />;
//   } else if (isAgent()) {
//     console.log('🎭 Rendering AgentDashboard');
//     return <AgentDashboard />;
//   } else {
//     console.log('🎭 Rendering default Dashboard');
//     return <Dashboard />;
//   }
// };

// function AppRoutes() {
//   console.log('🚀 AppRoutes rendering');
  
//   return (
//     <Router>
//       <div className="App">
//         <main>
//           <Routes>
//             {/* Public Routes - Properties as landing page */}
//             <Route path="/properties" element={<Properties />} />
//             <Route path="/property/:id" element={<PropertyDetail />} />
            
//             {/* Login Route */}
//             <Route path="/login" element={
//               <PublicRoute>
//                 <Login />
//               </PublicRoute>
//             } />
            
//             {/* Protected Routes */}
//             <Route path="/dashboard" element={
//               <ProtectedRoute>
//                 <RoleBasedDashboard />
//               </ProtectedRoute>
//             } />
            
//             {/* Admin-specific routes */}
//             <Route path="/admin" element={
//               <ProtectedRoute requireAdmin={true}>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             } />
            
//             {/* Agent-specific routes */}
//             <Route path="/agent" element={
//               <ProtectedRoute>
//                 <AgentDashboard />
//               </ProtectedRoute>
//             } />
            
//             {/* CRM route for both admin and agents */}
//             <Route path="/crm" element={
//               <ProtectedRoute>
//                 <CRM />
//               </ProtectedRoute>
//             } />
            
//             {/* Debug Auth Route */}
//             <Route path="/debug-auth" element={<DebugAuth />} />
            
//             {/* Redirect root to properties (landing page) */}
//             <Route path="/" element={<Navigate to="/properties" replace />} />
            
//             {/* Catch all route - redirect to properties for public users */}
//             <Route path="*" element={<Navigate to="/properties" replace />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// function App() {
//   return (
//     <MsalProvider instance={msalInstance}>
//       <GoogleAuthProvider>
//         <AuthProvider>
//           {/* <MicrosoftAuthHandler /> */}
//           <AppRoutes />
//         </AuthProvider>
//       </GoogleAuthProvider>
//     </MsalProvider>
//   );
// }

// export default App;


import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import './App.css';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import CRM from './pages/CRM';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import DebugAuth from './pages/DebugAuth';

import { AuthProvider, useAuth, GoogleAuthProvider } from './context/AuthContext';
import { msalConfig, loginRequest } from './config/msalConfig';
import './utils/clickTracker';

const msalInstance = new PublicClientApplication(msalConfig);

const MicrosoftAuthHandler = () => {
  const { instance } = useMsal();
  const { loginMicrosoft } = useAuth();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await instance.handleRedirectPromise();

        if (response) {
          const account = response.account;
          console.log("✅ Microsoft redirect response:", response);

          let token;
          try {
            token = await instance.acquireTokenSilent({
              ...loginRequest,
              account,
            });
          } catch (error) {
            console.warn("🔄 Silent token failed, trying popup:", error);
            token = await instance.acquireTokenPopup(loginRequest);
          }

          await loginMicrosoft({
            accessToken: token.accessToken,
            account,
            idToken: response.idToken,
          });

          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = '/dashboard';
        }
      } catch (err) {
        console.error('❌ Error during Microsoft redirect login:', err);
      }
    };

    handleRedirect();
  }, [instance, loginMicrosoft]);

  return null;
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const RoleBasedDashboard = () => {
  const { isAdmin, isAgent } = useAuth();

  if (isAdmin()) return <AdminDashboard />;
  if (isAgent()) return <AgentDashboard />;
  return <Dashboard />;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="App">
        <main>
          <Routes>
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/debug-auth" element={<DebugAuth />} />
            {/* <Route path="/" element={<Navigate to="/properties" replace />} /> */}
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/properties" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <GoogleAuthProvider>
        <AuthProvider>
          <MicrosoftAuthHandler />
          <AppRoutes />
        </AuthProvider>
      </GoogleAuthProvider>
    </MsalProvider>
  );
}

export default App;
