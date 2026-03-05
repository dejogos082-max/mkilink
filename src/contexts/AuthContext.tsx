import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { ref, push, onValue, update } from "firebase/database";
import { auth, db } from "../firebase";

export type UserRole = "UserFree" | "UserPremium" | "UserEnterprise" | "AdminUser";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole;
  roleConfig: any;
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
  const [role, setRole] = useState<UserRole>("UserFree");
  const [roleConfig, setRoleConfig] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check for user status
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            const status = userData.status;
            if (status === 'banned' || status === 'suspended') {
              firebaseSignOut(auth);
              setCurrentUser(null);
              setIsAdmin(false);
              setRole("UserFree");
              setRoleConfig(null);
              setLoading(false);
              alert(`Sua conta foi ${status === 'banned' ? 'banida' : 'suspensa'}. Entre em contato com o suporte.`);
              return;
            }
            
            const userRole = userData.role || "UserFree";
            setRole(userRole);
            setIsAdmin(userRole === "AdminUser");

            // Fetch role config
            if (userRole !== "AdminUser") {
              const roleConfigRef = ref(db, `role_configs/${userRole}`);
              onValue(roleConfigRef, (roleSnap) => {
                if (roleSnap.exists()) {
                  setRoleConfig(roleSnap.val());
                } else {
                  // Default fallback for Free
                  setRoleConfig({ 
                    maxShortLinks: 10, 
                    maxAdvancedLinks: 0, 
                    maxCampaigns: 1, 
                    maxBioPages: 1, 
                    qrCodes: false, 
                    monetization: false, 
                    access: ["dashboard", "links", "profile", "support", "plans"] 
                  });
                }
              });
            } else {
              // Admin has all access
              setRoleConfig({
                maxShortLinks: 999999,
                maxAdvancedLinks: 999999,
                maxCampaigns: 999999,
                maxBioPages: 999999,
                qrCodes: true,
                monetization: true,
                access: ["dashboard", "links", "link-bio", "campaigns", "stats", "monetization", "affiliates", "store", "plans", "support", "settings", "profile", "documentation", "admin"]
              });
            }
          }
        });

        setCurrentUser(user);

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
    roleConfig,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
