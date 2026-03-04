import { motion, AnimatePresence } from "motion/react";
import React, { ReactNode, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNativeApp } from "../contexts/NativeAppContext";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Link as LinkIcon, Grid, X, Bell, Trash2, Check } from "lucide-react";
import { Button } from "./Button";
import { db } from "../firebase";
import { ref, onValue, update, remove, push } from "firebase/database";

export function Layout({ children }: { children: ReactNode }) {
  const { currentUser, logout, isAdmin } = useAuth()!;
  const { isNativeApp, setNativeApp } = useNativeApp();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [toast, setToast] = useState<{title: string, message: string, type: string, actionType?: string, actionPayload?: string} | null>(null);
  const [prevNotifsLength, setPrevNotifsLength] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    setNativeApp(false);
  };

  // Scheduled Notifications Worker
  useEffect(() => {
    // Check for scheduled notifications every minute
    const checkScheduled = async () => {
      const scheduledRef = ref(db, "scheduled_notifications");
      onValue(scheduledRef, async (snapshot) => {
        if (!snapshot.exists()) return;
        
        const data = snapshot.val();
        const now = Date.now();
        const updates: Record<string, any> = {};
        let hasUpdates = false;

        // Get all users once if needed
        let allUsers: any[] = [];
        
        const processNotification = async (key: string, notif: any) => {
          if (notif.scheduledAt <= now && notif.status === 'pending') {
            hasUpdates = true;
            
            // Prepare the notification object for users
            const userNotification = {
              title: notif.title,
              message: notif.message,
              type: notif.type,
              actionType: notif.actionType || 'none',
              actionPayload: notif.actionPayload || '',
              createdAt: now, // Set creation time to now as it's being sent now
              read: false
            };

            if (notif.target === 'all') {
              if (allUsers.length === 0) {
                 // Fetch users only if we haven't yet
                 const usersSnapshot = await new Promise<any>((resolve) => {
                   onValue(ref(db, "users"), (snap) => resolve(snap.val()), { onlyOnce: true });
                 });
                 if (usersSnapshot) {
                   allUsers = Object.keys(usersSnapshot);
                 }
              }
              
              allUsers.forEach(userId => {
                const newKey = push(ref(db, `notifications/${userId}`)).key;
                if (newKey) {
                  updates[`notifications/${userId}/${newKey}`] = userNotification;
                }
              });
            } else if (notif.target === 'specific' && notif.targetEmail) {
               // We need to find the user ID by email. This is inefficient without an index, 
               // but for this scale it's acceptable or we assume we stored the ID.
               // Ideally, Admin should store targetUserId, but let's fetch users to find match.
               const usersSnapshot = await new Promise<any>((resolve) => {
                 onValue(ref(db, "users"), (snap) => resolve(snap.val()), { onlyOnce: true });
               });
               
               if (usersSnapshot) {
                 const userId = Object.entries(usersSnapshot).find(([_, u]: [string, any]) => u.email === notif.targetEmail)?.[0];
                 if (userId) {
                   const newKey = push(ref(db, `notifications/${userId}`)).key;
                   if (newKey) {
                     updates[`notifications/${userId}/${newKey}`] = userNotification;
                   }
                 }
               }
            }

            // Remove from scheduled or mark as sent
            updates[`scheduled_notifications/${key}`] = null; // Delete after sending
          }
        };

        const promises = Object.entries(data).map(([key, value]) => processNotification(key, value));
        await Promise.all(promises);

        if (hasUpdates) {
          await update(ref(db), updates);
        }
      }, { onlyOnce: true });
    };

    const interval = setInterval(checkScheduled, 60000); // Run every minute
    checkScheduled(); // Run immediately on mount

    return () => clearInterval(interval);
  }, []);

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
        
        // Check for new notifications to show toast
        if (list.length > prevNotifsLength && prevNotifsLength > 0) {
          const latest = list[0];
          // Only show if created recently (within last 10 seconds)
          if (Date.now() - latest.createdAt < 10000) {
            setToast({
              title: latest.title,
              message: latest.message,
              type: latest.type,
              actionType: latest.actionType,
              actionPayload: latest.actionPayload
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

  if (isNativeApp) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 pb-20">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: 0 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -50, x: 0 }}
              className="fixed top-20 right-4 z-[100] w-80 bg-white rounded-xl shadow-2xl ring-1 ring-gray-900/5 overflow-hidden"
            >
              <div className={`h-1 w-full ${
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-amber-500' :
                toast.type === 'success' ? 'bg-emerald-500' :
                'bg-indigo-500'
              }`} />
              <div className="p-4 flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                  toast.type === 'error' ? 'bg-red-100 text-red-600' :
                  toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-indigo-100 text-indigo-600'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900">{toast.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{toast.message}</p>
                </div>
                <button 
                  onClick={() => setToast(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Native Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 h-14 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
               <LinkIcon className="h-5 w-5" />
             </div>
             <span className="font-bold text-lg text-indigo-600">MKI Links</span>
           </div>
           
           {currentUser && (
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                   <Bell className="h-5 w-5" />
                   {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-1 ring-white" />}
                </button>
             </div>
           )}
        </header>

        {/* Notifications Drawer */}
        <AnimatePresence>
          {showNotifications && currentUser && (
             <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                   <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-900">Notificações</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Ler todas
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-200 rounded-full">
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                   </div>
                   
                   <div className="overflow-y-auto flex-1">
                     {notifications.length === 0 ? (
                       <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                         <div className="bg-gray-100 p-4 rounded-full mb-3">
                           <Bell className="w-8 h-8 text-gray-400" />
                         </div>
                         <p className="text-sm font-medium">Nenhuma notificação</p>
                         <p className="text-xs text-gray-400 mt-1">Você está em dia!</p>
                       </div>
                     ) : (
                       <div className="divide-y divide-gray-50">
                         {notifications.map((notif) => (
                           <div 
                             key={notif.id}
                             onClick={() => markAsRead(notif.id)}
                             className={`p-4 active:bg-gray-50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-indigo-50/40' : ''}`}
                           >
                             <div className="flex items-start gap-3">
                               <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                 notif.type === 'error' ? 'bg-red-500' :
                                 notif.type === 'warning' ? 'bg-amber-500' :
                                 notif.type === 'success' ? 'bg-emerald-500' :
                                 'bg-indigo-500'
                               }`} />
                               <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                   {notif.title}
                                 </p>
                                 <p className="text-xs text-gray-500 mt-0.5 break-words leading-relaxed">
                                   {notif.message}
                                 </p>
                                 {notif.actionType === 'link' && notif.actionPayload && (
                                   <a 
                                     href={notif.actionPayload} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="mt-3 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                     Abrir Link <LinkIcon className="w-3 h-3" />
                                   </a>
                                 )}
                                 {notif.actionType === 'route' && notif.actionPayload && (
                                   <Link 
                                     to={notif.actionPayload}
                                     className="mt-3 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-95 transition-transform"
                                     onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                                   >
                                     Acessar <LinkIcon className="w-3 h-3" />
                                   </Link>
                                 )}
                                 <p className="text-[10px] text-gray-400 mt-2">
                                   {new Date(notif.createdAt).toLocaleString()}
                                 </p>
                               </div>
                               <button 
                                 onClick={(e) => deleteNotification(notif.id, e)}
                                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
             </div>
          )}
        </AnimatePresence>

        <main className="p-4 pb-[calc(80px+env(safe-area-inset-bottom))]">
          {children}
        </main>

        {/* Bottom Navigation Bar - Sketchware/Native Style */}
        {currentUser && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-start pt-2 h-[calc(60px+env(safe-area-inset-bottom))] z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <Link to="/dashboard" className={`flex flex-col items-center justify-center w-full h-[50px] active:bg-gray-50 ${location.pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-400'}`}>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <LinkIcon className="h-6 w-6" strokeWidth={location.pathname === '/dashboard' ? 2.5 : 2} />
                </motion.div>
                <span className="text-[10px] mt-1 font-medium">Links</span>
             </Link>
             
             <Link to="/menu" className={`flex flex-col items-center justify-center w-full h-[50px] active:bg-gray-50 ${location.pathname === '/menu' ? 'text-indigo-600' : 'text-gray-400'}`}>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Grid className="h-6 w-6" strokeWidth={location.pathname === '/menu' ? 2.5 : 2} />
                </motion.div>
                <span className="text-[10px] mt-1 font-medium">Menu</span>
             </Link>
             
             <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-[50px] text-gray-400 active:bg-red-50 hover:text-red-600">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <LogOut className="h-6 w-6" />
                </motion.div>
                <span className="text-[10px] mt-1 font-medium">Sair</span>
             </button>
          </nav>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 0 }}
            className="fixed top-20 right-4 z-[100] w-80 bg-white rounded-xl shadow-2xl ring-1 ring-gray-900/5 overflow-hidden"
          >
            <div className={`h-1 w-full ${
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              toast.type === 'success' ? 'bg-emerald-500' :
              'bg-indigo-500'
            }`} />
            <div className="p-4 flex items-start gap-3">
              <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                toast.type === 'error' ? 'bg-red-100 text-red-600' :
                toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                'bg-indigo-100 text-indigo-600'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900">{toast.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{toast.message}</p>
                {toast.actionType === 'link' && toast.actionPayload && (
                  <a 
                    href={toast.actionPayload} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Abrir Link →
                  </a>
                )}
                {toast.actionType === 'route' && toast.actionPayload && (
                  <Link 
                    to={toast.actionPayload}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 block"
                    onClick={(e) => { e.stopPropagation(); setToast(null); }}
                  >
                    Acessar →
                  </Link>
                )}
              </div>
              <button 
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2 group">
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
                <span>MKI Links PRO</span>
              </motion.span>
              {isAdmin && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0, color: ["#DC2626", "#000000", "#DC2626"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5"
                >
                  <span>Administrador</span>
                </motion.span>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Link to={location.pathname === '/menu' ? '/' : '/menu'}>
                  <Button variant="ghost" size="sm" className={location.pathname === '/menu' ? 'bg-gray-100' : ''}>
                    <span className="flex items-center">
                      {location.pathname === '/menu' ? (
                        <X key="icon-x" className="mr-2 h-4 w-4" />
                      ) : (
                        <Grid key="icon-grid" className="mr-2 h-4 w-4" />
                      )}
                      <span>Menu</span>
                    </span>
                  </Button>
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </Button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowNotifications(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl ring-1 ring-gray-900/5 z-50 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notificações</h3>
                            {unreadCount > 0 && (
                              <button 
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Marcar todas como lidas
                              </button>
                            )}
                          </div>
                          
                          <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Nenhuma notificação</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                  <div 
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                        notif.type === 'error' ? 'bg-red-500' :
                                        notif.type === 'warning' ? 'bg-amber-500' :
                                        notif.type === 'success' ? 'bg-emerald-500' :
                                        'bg-indigo-500'
                                      }`} />
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                          {notif.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 break-words">
                                          {notif.message}
                                        </p>
                                        {notif.actionType === 'link' && notif.actionPayload && (
                                          <a 
                                            href={notif.actionPayload} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Abrir Link <LinkIcon className="w-3 h-3" />
                                          </a>
                                        )}
                                        {notif.actionType === 'route' && notif.actionPayload && (
                                          <Link 
                                            to={notif.actionPayload}
                                            className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                                            onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                                          >
                                            Acessar <LinkIcon className="w-3 h-3" />
                                          </Link>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">
                                          {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <button 
                                        onClick={(e) => deleteNotification(notif.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
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
                </div>

                <span className="hidden text-sm text-gray-600 sm:inline-block">
                  <span>{currentUser.email}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="hidden sm:flex">
                  <span className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </span>
                </Button>
              </>
            ) : (
              !isAuthPage && (
                <div className="flex gap-2">
                  <Link to="/login">
                    <Button variant="ghost">
                      <span>Entrar</span>
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button>
                      <span>Começar</span>
                    </Button>
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
