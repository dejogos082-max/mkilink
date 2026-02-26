import React, { createContext, useContext, useState, useEffect } from "react";

interface Settings {
  theme: "light" | "dark";
  blurEnabled: boolean;
  hardwareAcceleration: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("app_settings");
    return saved ? JSON.parse(saved) : {
      theme: "light",
      blurEnabled: true,
      hardwareAcceleration: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    
    // Apply theme to document
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

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
