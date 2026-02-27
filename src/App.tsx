import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoader } from "./components/GlobalLoader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Redirect from "./pages/Redirect";
import Menu from "./pages/Menu";
import Stats from "./pages/Stats";
import Monetization from "./pages/Monetization";
import LinkBioManager from "./pages/LinkBioManager";
import BioPage from "./pages/BioPage";
import Settings from "./pages/Settings";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()!;
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="relative rounded-full border-4 border-indigo-600 border-t-transparent animate-spin h-12 w-12"></div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalLoader>
        <AuthProvider>
          <SettingsProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/register" element={<Layout><Register /></Layout>} />
                
                {/* Public Bio Page - No Layout, standalone */}
                <Route path="/bio/:slug" element={<BioPage />} />
                
                {/* Redirect Route - No Layout usually, or minimal layout */}
                <Route path="/:shortId" element={<Redirect />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/menu"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Menu />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Stats />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/monetization"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Monetization />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/link-bio"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <LinkBioManager />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Router>
          </SettingsProvider>
        </AuthProvider>
      </GlobalLoader>
    </ErrorBoundary>
  );
}
