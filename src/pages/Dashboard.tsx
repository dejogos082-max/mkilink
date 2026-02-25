import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, push, set, onValue, query, orderByChild, equalTo, remove, update } from "firebase/database";
import { nanoid } from "nanoid";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { Copy, ExternalLink, Trash2, BarChart2, Calendar, Settings, X } from "lucide-react";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  userId: string;
  createdAt: number;
  clicks: number;
  settings?: {
    adCount?: number;
    duration?: number; // duration in seconds for the countdown
    expiresAt?: number | null; // timestamp or null for never
  };
}

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [error, setError] = useState("");
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentLinkSettings, setCurrentLinkSettings] = useState<LinkData | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    adCount: 3,
    duration: 15,
    expiresIn: "never", // "never", "1h", "24h", "7d", "30d"
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
        const linkList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        // Client-side sort by createdAt desc
        setLinks(linkList.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setLinks([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setError("");
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
            expiresAt: null
        }
      });

      setUrl("");
      setCustomAlias("");
    } catch (err: any) {
      console.error(err);
      setError("Failed to shorten link. " + err.message);
    }
    setLoading(false);
  }

  async function handleDelete(shortCode: string) {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;
    try {
      await remove(ref(db, `short_links/${shortCode}`));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  function copyToClipboard(shortCode: string) {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
  }

  const openSettings = (link: LinkData) => {
    setCurrentLinkSettings(link);
    setSettingsForm({
        adCount: link.settings?.adCount || 3,
        duration: link.settings?.duration || 15,
        expiresIn: "never" // We don't easily reverse calculate this for now, just reset to default choice
    });
    setIsSettingsOpen(true);
  };

  const saveSettings = async () => {
    if (!currentLinkSettings) return;

    let expiresAt = null;
    const now = Date.now();
    if (settingsForm.expiresIn === "1h") expiresAt = now + 3600 * 1000;
    if (settingsForm.expiresIn === "24h") expiresAt = now + 24 * 3600 * 1000;
    if (settingsForm.expiresIn === "7d") expiresAt = now + 7 * 24 * 3600 * 1000;
    if (settingsForm.expiresIn === "30d") expiresAt = now + 30 * 24 * 3600 * 1000;

    try {
        await update(ref(db, `short_links/${currentLinkSettings.shortCode}/settings`), {
            adCount: Number(settingsForm.adCount),
            duration: Math.max(15, Number(settingsForm.duration)), // Enforce min 15s
            expiresAt: expiresAt
        });
        setIsSettingsOpen(false);
    } catch (err) {
        console.error("Failed to update settings", err);
    }
  };

  return (
    <div className="space-y-12 relative">
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">Configurações do Link</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Quantidade de Anúncios (Página de Redirecionamento)</label>
                            <select 
                                value={settingsForm.adCount}
                                onChange={(e) => setSettingsForm({...settingsForm, adCount: Number(e.target.value)})}
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                            >
                                <option value={0}>Sem Anúncios</option>
                                <option value={1}>Baixo (1 Anúncio)</option>
                                <option value={3}>Médio (3 Anúncios)</option>
                                <option value={5}>Alto (5 Anúncios)</option>
                                <option value={10}>Máximo (10 Anúncios)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Duração da Contagem Regressiva (Segundos)</label>
                            <input 
                                type="number" 
                                min="15"
                                max="60"
                                value={settingsForm.duration}
                                onChange={(e) => setSettingsForm({...settingsForm, duration: Math.max(15, Number(e.target.value))})}
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                            />
                            <p className="text-xs text-gray-500">Mínimo 15 segundos</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Expiração do Link</label>
                            <select 
                                value={settingsForm.expiresIn}
                                onChange={(e) => setSettingsForm({...settingsForm, expiresIn: e.target.value})}
                                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                            >
                                <option value="never">Nunca Expirar</option>
                                <option value="1h">Expirar em 1 Hora</option>
                                <option value="24h">Expirar em 24 Horas</option>
                                <option value="7d">Expirar em 7 Dias</option>
                                <option value="30d">Expirar em 30 Dias</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
                        <Button className="flex-1" onClick={saveSettings}>Salvar Alterações</Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl"
        >
          Encurte seus Links
        </motion.h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Crie links curtos e memoráveis em segundos. Rastreie cliques e gerencie suas URLs com facilidade.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
          
          {error && <p className="text-sm text-red-600">{error}</p>}
          
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Encurtar URL
          </Button>
        </form>
      </motion.div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Seus Links</h2>
        
        {links.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum link ainda. Crie o seu primeiro acima!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {links.map((link) => (
                <motion.div
                  key={link.shortCode}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-shadow hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-indigo-600 flex items-center gap-2">
                          /{link.shortCode}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1 break-all" title={link.originalUrl}>
                          {link.originalUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => openSettings(link)}
                        >
                          <Settings className="h-3 w-3 mr-1.5" />
                          Editar Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(link.shortCode)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart2 className="h-3 w-3" />
                        {link.clicks} cliques
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(link.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => copyToClipboard(link.shortCode)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Link
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
