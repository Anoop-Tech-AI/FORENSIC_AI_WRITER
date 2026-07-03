import React, { useState, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MessageProvider } from './context/MessageContext';
import { NotificationProvider } from './context/NotificationContext';
import RoutesConfig from './routes';
import DebugFallback from './components/DebugFallback';
import { useAuth } from './context/AuthContext';
import './index.css';

// Inner component to access location
const AppContent = () => {
  const [locationKey, setLocationKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Update location key when route changes
    setLocationKey(prev => prev + 1);
  }, [location.pathname]);

  // Global error listener for debugging
  useEffect(() => {
    const handleError = (event) => {
      console.error('GLOBAL ERROR DETECTED:', event.error);
      setHasError(true);
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('UNHANDLED PROMISE REJECTION:', event.reason);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // CRM - Clean Storage on migration (Phase 4)
  useEffect(() => {
    const CURRENT_STRUCTURE_VERSION = '2.0.0';
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== CURRENT_STRUCTURE_VERSION) {
      console.warn('[AUTH] New structure detected. Clearing old session data.');
      // Preserve user authentication data
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      localStorage.clear();
      if (user) localStorage.setItem('user', user);
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('app_version', CURRENT_STRUCTURE_VERSION);
      // Refresh to ensure clean state
      if (savedVersion) window.location.reload();
    }
  }, []);
  
  // Debug logging - Phase 14
  useEffect(() => {
    console.log("Current route:", location.pathname);
    console.log("User role:", user?.role);
    console.log('AppContent mounted, location:', location.pathname);
    console.log('Has error:', hasError);
  }, [location.pathname, hasError, user]);

  if (hasError) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B1220', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#EF4444', marginBottom: '1rem' }}>Critical System Failure</h1>
        <p style={{ marginBottom: '2rem' }}>A runtime exception has compromised the neural link. Check the console for telemetry.</p>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ padding: '0.75rem 1.5rem', background: '#3B82F6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Factory Reset & Reinitialize
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <React.Suspense fallback={<DebugFallback />}>
        <RoutesConfig routeKey={locationKey} />
      </React.Suspense>
    </div>
  );
};

import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <MessageProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </MessageProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
