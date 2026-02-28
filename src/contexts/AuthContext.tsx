import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { ref, push, onValue, update } from "firebase/database";
import { auth, db } from "../firebase";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
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
            setLoading(false);
            alert(`Sua conta foi ${status === 'banned' ? 'banida' : 'suspensa'}. Entre em contato com o suporte.`);
            return;
          }
        });

        setCurrentUser(user);
        
        // Check for admin role
        const roleRef = ref(db, `users/${user.uid}/role`);
        onValue(roleRef, (snapshot) => {
          const role = snapshot.val();
          setIsAdmin(role === "AdminUser");
        });

        // Log access history once per session
        const sessionKey = `access_logged_${user.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          try {
            const response = await fetch("/api/ip");
            const data = await response.json();
            const ip = data.ip;

            // Update user's main record with email and latest IP
            await update(ref(db, `users/${user.uid}`), {
              email: user.email,
              lastIp: ip,
              lastLoginAt: Date.now()
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
        } else {
          // Even if we don't log history, ensure email is updated
          try {
            await update(ref(db, `users/${user.uid}`), {
              email: user.email
            });
          } catch (e) {
            console.error("Failed to update user email:", e);
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
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
