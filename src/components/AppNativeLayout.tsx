import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  Link as LinkIcon, 
  User, 
  ChevronLeft, 
  Settings, 
  MoreVertical,
  LogOut,
  Zap,
  Menu,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const AppNativeLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth()!;
  const [pageTitle, setPageTitle] = useState('MKI Links');
  const [showMenu, setShowMenu] = useState(false);

  // Set page title based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setPageTitle('Dashboard');
    else if (path.includes('/links')) setPageTitle('Meus Links');
    else if (path.includes('/create')) setPageTitle('Criar Link');
    else if (path.includes('/profile')) setPageTitle('Perfil');
    else if (path.includes('/settings')) setPageTitle('Configurações');
    else if (path.includes('/stats')) setPageTitle('Estatísticas');
    else setPageTitle('MKI Links');
  }, [location]);

  // Add native-app-mode class to html element
  useEffect(() => {
    document.documentElement.classList.add('native-app-mode');
    return () => {
      document.documentElement.classList.remove('native-app-mode');
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/appnativo/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/appnativo/dashboard' },
    { icon: PlusCircle, label: 'Criar', path: '/appnativo/links?create=true' }, // Assuming create is a modal or separate page
    { icon: LinkIcon, label: 'Links', path: '/appnativo/links' },
    { icon: User, label: 'Perfil', path: '/appnativo/profile' },
  ];

  const goBack = () => {
    navigate(-1);
  };

  // Check if we can go back (simple check, can be improved)
  const canGoBack = location.pathname !== '/appnativo/dashboard' && location.pathname !== '/appnativo/login';

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden font-sans select-none">
      {/* Native Header */}
      {currentUser && (
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 shadow-sm z-20 sticky top-0 safe-area-top">
          <div className="flex items-center gap-3">
            {canGoBack ? (
              <button 
                onClick={goBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="p-2 -ml-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            <h1 className="text-lg font-bold truncate max-w-[200px]">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all relative"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/20 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-12 right-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-40 overflow-hidden"
                  >
                    <div className="py-1">
                      <a 
                        href={location.pathname.replace('/appnativo', '') || '/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setShowMenu(false)}
                      >
                        <ExternalLink className="w-4 h-4" /> Abrir no Navegador
                      </a>
                      <Link 
                        to="/appnativo/settings" 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="w-4 h-4" /> Configurações
                      </Link>
                      <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 pb-20 safe-area-bottom">
        <div className="min-h-full p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path.includes('?') && location.pathname === item.path.split('?')[0]);
              return (
                <Link 
                  key={item.label} 
                  to={item.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
