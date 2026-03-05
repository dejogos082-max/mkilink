import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NativeAppContextType {
  isNativeApp: boolean;
  setNativeApp: (value: boolean) => void;
}

const NativeAppContext = createContext<NativeAppContextType | undefined>(undefined);

export function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check session storage on mount
    const stored = sessionStorage.getItem('isNativeApp');
    if (stored === 'true') {
      setIsNativeApp(true);
    }

    // Check if current path is /appnativo
    if (location.pathname === '/appnativo') {
      sessionStorage.setItem('isNativeApp', 'true');
      setIsNativeApp(true);
      // Redirect to home/dashboard after setting the flag
      // We use replace to avoid going back to /appnativo when pressing back
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  const setNativeApp = (value: boolean) => {
    setIsNativeApp(value);
    if (value) {
      sessionStorage.setItem('isNativeApp', 'true');
    } else {
      sessionStorage.removeItem('isNativeApp');
    }
  };

  return (
    <NativeAppContext.Provider value={{ isNativeApp, setNativeApp }}>
      {children}
    </NativeAppContext.Provider>
  );
}

export function useNativeApp() {
  const context = useContext(NativeAppContext);
  if (context === undefined) {
    throw new Error('useNativeApp must be used within a NativeAppProvider');
  }
  return context;
}
