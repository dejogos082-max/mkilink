import React, { useEffect, useState } from "react";
import { createAuth0Client, Auth0Client } from "@auth0/auth0-spa-js";
import { Button } from "../components/Button";
import { motion } from "motion/react";

export default function Auth0Login() {
  const [auth0Client, setAuth0Client] = useState<Auth0Client | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initAuth0() {
      try {
        const client = await createAuth0Client({
          domain: import.meta.env.VITE_AUTH0_DOMAIN,
          clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
          authorizationParams: {
            redirect_uri: window.location.origin + "/auth0-login",
          },
        });
        setAuth0Client(client);

        if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
          await client.handleRedirectCallback();
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const authenticated = await client.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const userProfile = await client.getUser();
          setUser(userProfile);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    initAuth0();
  }, []);

  const login = async () => {
    try {
      await auth0Client?.loginWithRedirect();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = async () => {
    try {
      await auth0Client?.logout({
        logoutParams: {
          returnTo: window.location.origin + "/auth0-login",
        },
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Erro: {error}</div>;

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5 text-center"
      >
        <h1 className="text-2xl font-bold">MKI Secure (Auth0)</h1>
        
        {!isAuthenticated ? (
          <Button onClick={login} className="w-full">Entrar com Auth0</Button>
        ) : (
          <div className="space-y-4">
            <p>Bem-vindo, {user?.name}!</p>
            <Button onClick={logout} variant="outline" className="w-full">Sair</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
