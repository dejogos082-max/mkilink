import React, { createContext, useContext, useState, useEffect } from "react";

interface Settings {
  blurEnabled: boolean;
  hardwareAcceleration: boolean;
  telemetryEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("app_settings");
    // Remove theme from saved settings if it exists
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed.theme;
      return parsed;
    }
    return {
      blurEnabled: true,
      hardwareAcceleration: true,
      telemetryEnabled: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    
    // Ensure dark mode is always removed
    document.documentElement.classList.remove("dark");

    // Apply blur class to body if needed
    if (settings.blurEnabled) {
      document.body.classList.add("blur-enabled");
    } else {
      document.body.classList.remove("blur-enabled");
    }

    // Hardware acceleration hint (CSS)
    if (settings.hardwareAcceleration) {
      document.documentElement.style.setProperty("--hw-accel", "translateZ(0)");
    } else {
      document.documentElement.style.setProperty("--hw-accel", "none");
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
