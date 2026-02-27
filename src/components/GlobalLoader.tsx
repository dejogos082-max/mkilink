import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function GlobalLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if document is already loaded
    if (document.readyState === 'complete') {
      // Add a small delay for better UX (avoid flash of loading screen)
      const timeout = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timeout);
    }

    const handleLoad = () => {
      setTimeout(() => setLoading(false), 500);
    };

    window.addEventListener('load', handleLoad);
    
    // Safety timeout in case load event doesn't fire or takes too long
    const safetyTimeout = setTimeout(() => setLoading(false), 3000);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(safetyTimeout);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500">
        <div className="relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="relative rounded-full border-4 border-indigo-600 border-t-transparent animate-spin h-16 w-16"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
