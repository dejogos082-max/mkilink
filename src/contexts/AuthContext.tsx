import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { ref, push, onValue } from "firebase/database";
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
      setCurrentUser(user);
      
      if (user) {
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
            const response = await fetch("https://api.ipify.org?format=json");
            const data = await response.json();
            const ip = data.ip;

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
