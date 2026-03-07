import React, { ReactNode, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  PlusCircle, 
  Link as LinkIcon, 
  User, 
  ArrowLeft, 
  Bell, 
  LogOut, 
  X, 
  Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { ref, onValue, update, remove } from "firebase/database";
import { Button } from "../components/Button";

// Helper to determine page title
const getPageTitle = (pathname: string) => {
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/links')) return 'Meus Links';
  if (pathname.includes('/create')) return 'Criar Link';
  if (pathname.includes('/profile')) return 'Perfil';
  if (pathname.includes('/settings')) return 'Configurações';
  if (pathname.includes('/stats')) return 'Estatísticas';
  return 'MKI Links PRO';
};

export function AppNativeLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout } = useAuth()!;
  const location = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);
  
  // Notification State (Duplicated from Layout.tsx for isolation)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevNotifsLength, setPrevNotifsLength] = useState(0);
  const [toast, setToast] = useState<{title: string, message: string, type: string} | null>(null);

  // Load Notifications
  useEffect(() => {
    if (!currentUser) return;

    const notifRef = ref(db, `notifications/${currentUser.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        })).sort((a, b) => b.createdAt - a.createdAt);
        
        // Toast logic
        if (list.length > prevNotifsLength && prevNotifsLength > 0) {
          const latest = list[0];
          if (Date.now() - latest.createdAt < 10000) {
            setToast({
              title: latest.title,
              message: latest.message,
              type: latest.type
            });
            setTimeout(() => setToast(null), 5000);
          }
        }
        
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.read).length);
        setPrevNotifsLength(list.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
        setPrevNotifsLength(0);
      }
    });

    return () => unsubscribe();
  }, [currentUser, prevNotifsLength]);

  const markAsRead = async (notifId: string) => {
    if (!currentUser) return;
    await update(ref(db, `notifications/${currentUser.uid}/${notifId}`), { read: true });
  };

  const deleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await remove(ref(db, `notifications/${currentUser.uid}/${notifId}`));
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const updates: Record<string, any> = {};
    notifications.forEach(n => {
      if (!n.read) {
        updates[`notifications/${currentUser.uid}/${n.id}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  };

  const isHome = location.pathname === '/appnativo/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Native Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button 
              onClick={() => navigate(-1)}
              className="p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px]">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        </div>
      </header>

      {/* Notifications Drawer (Overlay) */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[70] w-full max-w-xs bg-white shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 font-medium"
                    >
                      Ler todas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Sem notificações</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3 rounded-lg border ${!notif.read ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'} relative group`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className={`text-sm font-medium ${!notif.read ? 'text-indigo-900' : 'text-gray-900'}`}>{notif.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button 
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="p-4 safe-area-bottom">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 z-40 flex items-center justify-around px-2 pb-safe">
        <Link 
          to="/appnativo/dashboard" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/dashboard') ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link 
          to="/appnativo/create" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/create') ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <PlusCircle className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Criar</span>
        </Link>
        
        <Link 
          to="/appnativo/links" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/links') ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <LinkIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Links</span>
        </Link>
        
        <Link 
          to="/appnativo/profile" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('/profile') ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Perfil</span>
        </Link>
      </nav>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-gray-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-sm">{toast.title}</h4>
              <p className="text-xs text-gray-300">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
