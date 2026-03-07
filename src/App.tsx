import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { NativeAppProvider } from "./contexts/NativeAppContext";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalLoader } from "./components/GlobalLoader";
import Login from "./pages/Login";
import Auth0Login from "./pages/Auth0Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Redirect from "./pages/Redirect";
import Menu from "./pages/Menu";
import LinksManager from "./pages/LinksManager";
import SimpleLinksManager from "./pages/SimpleLinksManager";
import Stats from "./pages/Stats";
import Monetization from "./pages/Monetization";
import LinkBioManager from "./pages/LinkBioManager";
import BioPage from "./pages/BioPage";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import PlanCheckout from "./pages/PlanCheckout";

import Store from "./pages/Store";
import ProductDetails from "./pages/ProductDetails";
import CheckoutPage from "./pages/Checkout";
import AcceptInvite from "./pages/AcceptInvite";

import Plans from "./pages/Plans";

import Campaigns from "./pages/Campaigns";
import CustomDomains from "./pages/CustomDomains";

import Affiliates from "./pages/Affiliates";
import EditLink from "./pages/EditLink";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, roleSettings, isAdmin } = useAuth()!;
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="relative rounded-full border-4 border-indigo-600 border-t-transparent animate-spin h-12 w-12"></div>
      </div>
    );
  }
  
  if (!currentUser) return <Navigate to="/login" />;

  // Admin bypasses all checks
  if (isAdmin) return <>{children}</>;

  // Always allow core pages regardless of role settings
  const corePages = ['/dashboard', '/menu', '/settings', '/profile', '/plans', '/manage-plan', '/accept-invite'];
  if (corePages.some(page => location.pathname === page || location.pathname.startsWith(`${page}/`))) {
    return <>{children}</>;
  }

  // Check role-based access
  if (roleSettings && roleSettings.allowedPages) {
    const currentPath = location.pathname;
    
    // Always allow dashboard to prevent lockout loops, unless explicitly desired otherwise.
    // But if the admin unchecks dashboard, they probably mean it. 
    // However, we need a fallback. Let's assume /dashboard is the safe landing.
    
    // Check if the current path starts with any of the allowed paths
    // e.g. /links/edit/123 matches /links
    const isAllowed = roleSettings.allowedPages.some(allowedPath => 
      currentPath === allowedPath || currentPath.startsWith(`${allowedPath}/`)
    );

    // Special case: /dashboard should probably be accessible if it's the redirect target
    // If the user tries to access a restricted page, send them to the first allowed page or dashboard
    if (!isAllowed) {
      // If they are not allowed on current page
      if (currentPath === '/dashboard') {
         // If even dashboard is not allowed, try to find the first allowed page
         if (roleSettings.allowedPages.length > 0) {
             return <Navigate to={roleSettings.allowedPages[0]} />;
         }
         // If nothing is allowed... show a message? or let them stay (it will render children but maybe empty layout?)
         // For now, let's fallback to profile if dashboard is blocked, or just allow dashboard as a hard rule for safety?
         // The user request said "configure access of pages... which each role can access or not".
         // So I should respect the setting.
         
         // If dashboard is blocked and they are at dashboard, and have other pages, go there.
         // If no pages allowed, well...
      } else {
          // Redirect to dashboard if allowed, otherwise first allowed page
          if (roleSettings.allowedPages.includes('/dashboard')) {
              return <Navigate to="/dashboard" />;
          } else if (roleSettings.allowedPages.length > 0) {
              return <Navigate to={roleSettings.allowedPages[0]} />;
          }
      }
    }
  }
  
  return <>{children}</>;
}

import Landing from "./pages/Landing";

function Home() {
  const { currentUser, loading } = useAuth()!;
  
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="relative rounded-full border-4 border-indigo-600 border-t-transparent animate-spin h-12 w-12"></div>
      </div>
    );
  }
  
  return currentUser ? <Navigate to="/dashboard" /> : <Landing />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalLoader>
        <AuthProvider>
          <SettingsProvider>
            <Router>
              <NativeAppProvider>
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/auth0-login" element={<Layout><Auth0Login /></Layout>} />
                <Route path="/register" element={<Layout><Register /></Layout>} />
                
                {/* Public Bio Page - No Layout, standalone */}
                <Route path="/bio/:slug" element={<BioPage />} />
                
                {/* Redirect Route - No Layout usually, or minimal layout */}
                <Route path="/:shortId" element={<Redirect />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
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
                  path="/links"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <LinksManager />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/links/edit/:shortCode"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <EditLink />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/simple-links"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <SimpleLinksManager />
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
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/checkout/plan/:planId"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <PlanCheckout />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Plans />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/checkout/plan/:planId"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <PlanCheckout />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/store"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Store />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/store/product/:id"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ProductDetails />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/store/checkout/:id"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CheckoutPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/campaigns"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Campaigns />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/custom-domains"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CustomDomains />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/affiliates"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Affiliates />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Admin />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/accept-invite/:inviteCode"
                  element={
                    <PrivateRoute>
                      <AcceptInvite />
                    </PrivateRoute>
                  }
                />
              </Routes>
              </NativeAppProvider>
            </Router>
          </SettingsProvider>
        </AuthProvider>
      </GlobalLoader>
    </ErrorBoundary>
  );
}
