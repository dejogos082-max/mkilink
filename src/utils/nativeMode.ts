
declare global {
  interface Window {
    MKI_APP?: boolean;
    MKI_APP_MODE?: boolean;
  }
}

export const isNativeAppMode = (): boolean => {
  return false;
};

// Initialize global flag
if (typeof window !== 'undefined') {
  window.MKI_APP_MODE = isNativeAppMode();
}
