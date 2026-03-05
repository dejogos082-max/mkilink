import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { ref, push, onValue, update } from "firebase/database";
import { auth, db } from "../firebase";

interface RoleSettings {
  maxShortLinks: number;
  maxAdvancedLinks: number;
  maxCampaigns: number;
  maxBioPages: number;
  allowAutoQrCode: boolean;
  allowMonetization: boolean;
  allowedPages: string[];
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: string | null;
  roleSettings: RoleSettings | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [roleSettings, setRoleSettings] = useState<RoleSettings | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check for user status
        const statusRef = ref(db, `users/${user.uid}/status`);
        onValue(statusRef, (snapshot) => {
          const status = snapshot.val();
          if (status === 'banned' || status === 'suspended') {
            firebaseSignOut(auth);
            setCurrentUser(null);
            setIsAdmin(false);
            setRole(null);
            setRoleSettings(null);
            setLoading(false);
            alert(`Sua conta foi ${status === 'banned' ? 'banida' : 'suspensa'}. Entre em contato com o suporte.`);
            return;
          }
        });

        setCurrentUser(user);
        
        // Check for role
        const roleRef = ref(db, `users/${user.uid}/role`);
        onValue(roleRef, (snapshot) => {
          const userRole = snapshot.val() || "UserFree"; // Default to UserFree
          setRole(userRole);
          setIsAdmin(userRole === "AdminUser");

          // Fetch settings for this role
          const settingsRef = ref(db, `settings/roles/${userRole}`);
          onValue(settingsRef, (settingsSnapshot) => {
            if (settingsSnapshot.exists()) {
              setRoleSettings(settingsSnapshot.val());
            } else {
              // Default settings if not configured
              setRoleSettings({
                maxShortLinks: 10,
                maxAdvancedLinks: 5,
                maxCampaigns: 1,
                maxBioPages: 1,
                allowAutoQrCode: false,
                allowMonetization: false,
                allowedPages: []
              });
            }
          });
        });

        // Always ensure email is up to date
        try {
          await update(ref(db, `users/${user.uid}`), {
            email: user.email,
            lastLoginAt: Date.now()
          });
        } catch (e) {
          console.error("Failed to update user email:", e);
        }

        // Log access history once per session
        const sessionKey = `access_logged_${user.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          try {
            const response = await fetch("/api/ip");
            const data = await response.json();
            const ip = data.ip;

            // Update user's IP
            await update(ref(db, `users/${user.uid}`), {
              lastIp: ip
            });

            const historyRef = ref(db, `users/${user.uid}/loginHistory`);
            await push(historyRef, {
              ip,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
            });

            sessionStorage.setItem(sessionKey, "true");
          } catch (error) {
            console.error("Failed to log access history:", error);
          }
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    role,
    roleSettings,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
