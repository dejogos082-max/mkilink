import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, set, onValue, query, orderByChild, equalTo } from "firebase/database";
import { nanoid } from "nanoid";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Link as LinkIcon, ArrowRight, Zap, BarChart3, MousePointer2, Globe } from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    activeLinks: 0,
    totalLinks: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    const linksRef = query(
      ref(db, "short_links"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const unsubscribe = onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linkList = Object.values(data) as any[];
        const totalClicks = linkList.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
        const activeLinks = linkList.filter(link => !link.settings?.expiresAt || link.settings.expiresAt > Date.now()).length;
        
        setStats({
          totalClicks,
          activeLinks,
          totalLinks: linkList.length
        });
      } else {
        setStats({ totalClicks: 0, activeLinks: 0, totalLinks: 0 });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError("");
      setSuccess(null);
      setLoading(true);

      const shortCode = customAlias.trim() || nanoid(6);
      const newLinkRef = ref(db, `short_links/${shortCode}`);
      
      await set(newLinkRef, {
        originalUrl: url,
        shortCode,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        settings: {
            adCount: 3,
            duration: 15,
            expiresAt: null,
            layout: 'default',
            headerTitle: 'Valecraft'
        }
      });

      setSuccess(shortCode);
      setUrl("");
      setCustomAlias("");
    } catch (err: any) {
      console.error(err);
      setError("Falha ao encurtar link. " + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl text-indigo-600 mb-2"
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl"
        >
          <span>Encurte seus Links</span>
        </motion.h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          <span>Crie links curtos e memoráveis em segundos. Rastreie cliques e gerencie suas URLs com facilidade.</span>
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="URL de Destino"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/url/muito/longa"
              />
            </div>
            <div className="sm:col-span-2">
               <Input
                label="Alias Personalizado (Opcional)"
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="meu-link-personalizado"
                pattern="[a-zA-Z0-9-_]+"
                title="Apenas letras, números, hífens e sublinhados permitidos"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"><span>{error}</span></p>}
          
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900"><span>Link criado com sucesso!</span></p>
                  <p className="text-xs text-emerald-700"><span>{window.location.origin}/{success}</span></p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${success}`)}
              >
                <span>Copiar</span>
              </Button>
            </div>
          )}
          
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            <span>Encurtar URL</span>
          </Button>
        </form>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5 flex items-center gap-4"
        >
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <MousePointer2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium"><span>Total de Cliques</span></p>
            <h3 className="text-2xl font-bold text-gray-900"><span>{stats.totalClicks.toLocaleString()}</span></h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5 flex items-center gap-4"
        >
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium"><span>Links Ativos</span></p>
            <h3 className="text-2xl font-bold text-gray-900"><span>{stats.activeLinks}</span></h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5 flex items-center gap-4"
        >
          <div className="h-12 w-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium"><span>Total de Links</span></p>
            <h3 className="text-2xl font-bold text-gray-900"><span>{stats.totalLinks}</span></h3>
          </div>
        </motion.div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link 
          to="/links" 
          className="group p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:ring-indigo-500/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <LinkIcon className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900"><span>Gerenciar Links</span></h3>
          <p className="text-sm text-gray-500"><span>Visualize, edite e acompanhe o desempenho de todos os seus links.</span></p>
        </Link>

        <Link 
          to="/stats" 
          className="group p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:ring-indigo-500/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900"><span>Ver Estatísticas</span></h3>
          <p className="text-sm text-gray-500"><span>Análises detalhadas de cliques, origens e dispositivos.</span></p>
        </Link>
      </div>
    </div>
  );
}
