import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { 
  Link as LinkIcon, 
  MousePointer2, 
  TrendingUp, 
  Activity,
  Plus,
  Zap,
  ArrowRight,
  DollarSign,
  Eye
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { nanoid } from "nanoid";
import { set } from "firebase/database";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
    earnings: 0,
    todayEarnings: 0,
    cpm: 1.5, // Default CPM
    totalViews: 0
  });
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickLinkUrl, setQuickLinkUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const linksRef = query(
      ref(db, "short_links"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const earningsRef = ref(db, `earnings/${currentUser.uid}`);
    const viewsRef = query(ref(db, `views/${currentUser.uid}`), orderByChild("timestamp"));

    const unsubscribeLinks = onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linksList = Object.values(data);
        const totalLinks = linksList.length;
        const totalClicks = linksList.reduce((acc: number, curr: any) => acc + (curr.clicks || 0), 0);
        const activeLinks = linksList.length; // Simplified for now

        // Get recent 5 links
        const recent = Object.entries(data)
            .map(([key, value]: [string, any]) => ({ id: key, ...value }))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

        setStats(prev => ({ ...prev, totalLinks, totalClicks, activeLinks }));
        setRecentLinks(recent);
      } else {
        setStats(prev => ({ ...prev, totalLinks: 0, totalClicks: 0, activeLinks: 0 }));
        setRecentLinks([]);
      }
      setLoading(false);
    });

    const unsubscribeEarnings = onValue(earningsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setStats(prev => ({ 
                ...prev, 
                earnings: data.balance || 0,
                totalViews: data.totalViews || 0
            }));
        }
    });

    // Calculate today's earnings from views
    // This might be heavy if many views, but for MVP it's okay.
    // Better to aggregate on server side or store daily stats.
    // For now, let's just fetch all views and filter client side (careful with scale).
    // Optimization: Query views by timestamp startAt(today)
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    // We can't easily query by timestamp AND userId in simple firebase structure without composite index.
    // Assuming `views/{userId}` contains all views for that user.
    const unsubscribeViews = onValue(viewsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const views = Object.values(data) as any[];
            const todayViews = views.filter(v => v.timestamp >= startOfDay.getTime());
            const todayEarnings = todayViews.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            setStats(prev => ({ ...prev, todayEarnings }));
        }
    });

    return () => {
        unsubscribeLinks();
        unsubscribeEarnings();
        unsubscribeViews();
    };
  }, [currentUser]);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLinkUrl.trim() || !currentUser) return;

    setIsCreating(true);
    try {
      const shortCode = nanoid(6);
      await set(ref(db, `short_links/${shortCode}`), {
        originalUrl: quickLinkUrl,
        shortCode,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        type: 'simple', // Quick links are simple by default
        settings: {
            adCount: 3,
            duration: 15
        }
      });
      setQuickLinkUrl("");
      // Show success feedback (could be a toast, but for now just clear input)
      navigate('/links');
    } catch (error) {
      console.error("Error creating link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {currentUser?.displayName?.split(' ')[0] || 'Usuário'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Aqui está o resumo do seu desempenho hoje.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/links')} variant="secondary">
            Gerenciar Links
          </Button>
          <Button onClick={() => navigate('/plans')} className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
            <Zap className="w-4 h-4 mr-2" />
            Fazer Upgrade
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ganhos Totais</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `$${stats.earnings.toFixed(2)}`}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ganhos Hoje</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `$${stats.todayEarnings.toFixed(2)}`}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <MousePointer2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Cliques</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalClicks.toLocaleString()}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Visualizações CPM</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalViews.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 mt-1">CPM: ${stats.cpm.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Create */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">Criar Link Rápido</h2>
            <p className="text-indigo-100 mb-6 max-w-md">Cole sua URL longa abaixo para encurtá-la instantaneamente e começar a monitorar seus resultados.</p>
            
            <form onSubmit={handleQuickCreate} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="url" 
                placeholder="Cole seu link aqui..." 
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 border-0 focus:ring-2 focus:ring-white/50 outline-none shadow-lg"
                value={quickLinkUrl}
                onChange={(e) => setQuickLinkUrl(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={isCreating}
                className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Encurtar</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Links Recentes</h3>
            <Link to="/links" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Carregando...</div>
            ) : recentLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Nenhum link recente</div>
            ) : (
              recentLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer" onClick={() => navigate('/links')}>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">/{link.shortCode}</p>
                    <p className="text-xs text-gray-500 truncate">{link.originalUrl}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{link.clicks}</p>
                    <p className="text-xs text-gray-500">cliques</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
