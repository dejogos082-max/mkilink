import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppNativeLayout } from "../layouts/AppNativeLayout";
import { useAuth } from "../contexts/AuthContext";
import Dashboard from "../pages/Dashboard";
import LinksManager from "../pages/LinksManager";
import SimpleLinksManager from "../pages/SimpleLinksManager";
import Settings from "../pages/Settings";
import Profile from "../pages/Profile";
import Redirect from "../pages/Redirect";
import Login from "../pages/Login";

function NativePrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()!;
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="relative rounded-full border-4 border-indigo-600 border-t-transparent animate-spin h-12 w-12"></div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/appnativo/login" />;
}

export default function AppNativeRoutes() {
  const { currentUser } = useAuth()!;

  return (
    <Routes>
      {/* Entry Point */}
      <Route 
        path="app" 
        element={currentUser ? <Navigate to="/appnativo/dashboard" /> : <Navigate to="/appnativo/login" />} 
      />
      
      {/* Auth Routes */}
      <Route 
        path="login" 
        element={
          currentUser ? <Navigate to="/appnativo/dashboard" /> : <div className="p-4"><Login /></div>
        } 
      />

      {/* Protected App Routes */}
      <Route
        path="dashboard"
        element={
          <NativePrivateRoute>
            <AppNativeLayout>
              <Dashboard />
            </AppNativeLayout>
          </NativePrivateRoute>
        }
      />
      <Route
        path="links"
        element={
          <NativePrivateRoute>
            <AppNativeLayout>
              <LinksManager />
            </AppNativeLayout>
          </NativePrivateRoute>
        }
      />
      <Route
        path="create"
        element={
          <NativePrivateRoute>
            <AppNativeLayout>
              <SimpleLinksManager />
            </AppNativeLayout>
          </NativePrivateRoute>
        }
      />
      <Route
        path="settings"
        element={
          <NativePrivateRoute>
            <AppNativeLayout>
              <Settings />
            </AppNativeLayout>
          </NativePrivateRoute>
        }
      />
      <Route
        path="profile"
        element={
          <NativePrivateRoute>
            <AppNativeLayout>
              <Profile />
            </AppNativeLayout>
          </NativePrivateRoute>
        }
      />

      {/* Short Link Redirect - Must be last */}
      <Route path=":shortId" element={<Redirect />} />
      
      {/* Default Redirect */}
      <Route path="" element={<Navigate to="/appnativo/app" />} />
    </Routes>
  );
}
