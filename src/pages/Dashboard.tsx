import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { 
  Link as LinkIcon, 
  MousePointer2, 
  Activity,
  Plus,
  Zap,
  ArrowRight,
  Folder
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { nanoid } from "nanoid";
import { set } from "firebase/database";
import { isNativeAppMode } from "../utils/nativeMode";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    totalCampaigns: 0,
    performance: 0
  });
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickLinkUrl, setQuickLinkUrl] = useState("");
  const [simpleLinkUrl, setSimpleLinkUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSimple, setIsCreatingSimple] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const linksRef = query(
      ref(db, "short_links"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const campaignsRef = query(
      ref(db, "campaigns"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    // We'll use views to calculate performance (CTR)
    const viewsRef = query(ref(db, `views/${currentUser.uid}`));

    let linksData = { count: 0, clicks: 0 };
    let campaignsCount = 0;
    let viewsCount = 0;

    const updateStats = () => {
      const performance = viewsCount > 0 ? (linksData.clicks / viewsCount) * 100 : 0;
      setStats({
        totalLinks: linksData.count,
        totalClicks: linksData.clicks,
        totalCampaigns: campaignsCount,
        performance
      });
      setLoading(false);
    };

    const unsubscribeLinks = onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linksList = Object.values(data);
        linksData.count = linksList.length;
        linksData.clicks = linksList.reduce<number>((acc, curr: any) => acc + (curr.clicks || 0), 0);

        // Get recent 5 links
        const recent = Object.entries(data)
            .map(([key, value]: [string, any]) => ({ id: key, ...value }))
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);
        setRecentLinks(recent);
      } else {
        linksData = { count: 0, clicks: 0 };
        setRecentLinks([]);
      }
      updateStats();
    });

    const unsubscribeCampaigns = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      campaignsCount = data ? Object.keys(data).length : 0;
      updateStats();
    });

    const unsubscribeViews = onValue(viewsRef, (snapshot) => {
      const data = snapshot.val();
      viewsCount = data ? Object.keys(data).length : 0;
      updateStats();
    });

    return () => {
      unsubscribeLinks();
      unsubscribeCampaigns();
      unsubscribeViews();
    };
  }, [currentUser]);

  const handleQuickCreate = async (e: React.FormEvent, type: 'standard' | 'simple' = 'standard') => {
    e.preventDefault();
    const url = type === 'standard' ? quickLinkUrl : simpleLinkUrl;
    
    if (!url.trim() || !currentUser) return;

    if (type === 'standard') setIsCreating(true);
    else setIsCreatingSimple(true);

    try {
      const shortCode = nanoid(6);
      const linkData: any = {
        originalUrl: url,
        shortCode,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        type: type,
        settings: {
            adCount: 3,
            duration: 15
        }
      };

      if (type === 'simple') {
          linkData.settings = { rotationDestinations: null };
      }

      await set(ref(db, `short_links/${shortCode}`), linkData);
      
      if (type === 'standard') setQuickLinkUrl("");
      else setSimpleLinkUrl("");

      // Show success feedback (could be a toast, but for now just clear input)
      const prefix = isNativeAppMode() ? '/appnativo' : '';
      navigate(type === 'simple' ? `${prefix}/simple-links` : `${prefix}/links`);
    } catch (error) {
      console.error("Error creating link:", error);
    } finally {
      if (type === 'standard') setIsCreating(false);
      else setIsCreatingSimple(false);
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
          <Button onClick={() => navigate(isNativeAppMode() ? '/appnativo/links' : '/links')} variant="secondary">
            Gerenciar Links
          </Button>
          <Button onClick={() => navigate(isNativeAppMode() ? '/appnativo/plans' : '/plans')} className="bg-gradient-to-r from-indigo-600 to-purple-600 border-0">
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
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Performance</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : `${stats.performance.toFixed(1)}%`}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Links</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalLinks.toLocaleString()}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Campanhas</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {loading ? "..." : stats.totalCampaigns.toLocaleString()}
              </h3>
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
          className="lg:col-span-2 space-y-6"
        >
          {/* Standard Link Creator */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Zap className="w-5 h-5 text-yellow-300" />
                </div>
                <h2 className="text-xl font-bold">Criar Link Monetizado</h2>
              </div>
              <p className="text-indigo-100 mb-6 max-w-md">Cole sua URL longa para criar um link protegido com anúncios e começar a ganhar.</p>
              
              <form onSubmit={(e) => handleQuickCreate(e, 'standard')} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="url" 
                  placeholder="https://seu-link-longo.com/exemplo" 
                  className="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-white border-2 border-transparent focus:border-yellow-400 focus:ring-0 outline-none shadow-lg placeholder-gray-400"
                  value={quickLinkUrl}
                  onChange={(e) => setQuickLinkUrl(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Encurtar</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Simple Link Creator */}
          <div className="bg-gradient-to-br from-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-16 -mt-16"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/20 rounded-full blur-2xl -mr-10 -mb-10"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold">Criar Link Simples (Direto)</h2>
              </div>
              <p className="text-purple-100 mb-6 max-w-md">Redirecionamento instantâneo sem anúncios. Ideal para uso interno ou compartilhamento rápido.</p>
              
              <form onSubmit={(e) => handleQuickCreate(e, 'simple')} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="url" 
                  placeholder="https://seu-link-longo.com/exemplo" 
                  className="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-white border-2 border-transparent focus:border-yellow-400 focus:ring-0 outline-none shadow-lg placeholder-gray-400"
                  value={simpleLinkUrl}
                  onChange={(e) => setSimpleLinkUrl(e.target.value)}
                  required
                />
                <button 
                  type="submit" 
                  disabled={isCreatingSimple}
                  className="px-6 py-3 bg-yellow-400 text-indigo-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {isCreatingSimple ? (
                    <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Criar</span>
                    </>
                  )}
                </button>
              </form>
            </div>
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
            <Link to={isNativeAppMode() ? "/appnativo/links" : "/links"} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
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
                <div key={link.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer" onClick={() => navigate(isNativeAppMode() ? '/appnativo/links' : '/links')}>
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
