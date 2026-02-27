import { motion } from "motion/react";
import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Link as LinkIcon, Grid, X } from "lucide-react";
import { Button } from "./Button";

export function Layout({ children }: { children: ReactNode }) {
  const { currentUser, logout, isAdmin } = useAuth()!;
  const location = useLocation();

  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"
            >
              <LinkIcon className="h-5 w-5" />
            </motion.div>
            <div className="flex flex-col">
              <motion.span 
                initial={{ opacity: 0, x: -20, backgroundPosition: "0% 50%" }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
                }}
                transition={{ 
                  opacity: { duration: 0.5, delay: 0.1 },
                  x: { duration: 0.5, delay: 0.1 },
                  backgroundPosition: {
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
                style={{ backgroundSize: "200% auto" }}
                className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 leading-none"
              >
                MKI Links PRO
              </motion.span>
              {isAdmin && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0, color: ["#DC2626", "#000000", "#DC2626"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5"
                >
                  Administrador
                </motion.span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Link to={location.pathname === '/menu' ? '/' : '/menu'}>
                  <Button variant="ghost" size="sm" className={location.pathname === '/menu' ? 'bg-gray-100' : ''}>
                    {location.pathname === '/menu' ? <X className="mr-2 h-4 w-4" /> : <Grid className="mr-2 h-4 w-4" />}
                    Menu
                  </Button>
                </Link>
                <span className="hidden text-sm text-gray-600 sm:inline-block">
                  {currentUser.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden sm:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              !isAuthPage && (
                <div className="flex gap-2">
                  <Link to="/login">
                    <Button variant="ghost">Entrar</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Começar</Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
