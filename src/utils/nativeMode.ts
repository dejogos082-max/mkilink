
declare global {
  interface Window {
    MKI_APP?: boolean;
    MKI_APP_MODE?: boolean;
  }
}

export const isNativeAppMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for WebView bridge
  if (window.MKI_APP) return true;
  
  // Check for URL path
  if (window.location.pathname.startsWith('/appnativo')) return true;
  
  return false;
};

// Initialize global flag
if (typeof window !== 'undefined') {
  window.MKI_APP_MODE = isNativeAppMode();
}
