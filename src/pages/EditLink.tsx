import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, update, get, query, orderByChild, equalTo, onValue } from "firebase/database";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Settings,
  Link as LinkIcon
} from "lucide-react";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  userId: string;
  createdAt: number;
  clicks: number;
  type?: string;
  tags?: string[];
  campaignId?: string;
  customDomain?: string;
  settings?: {
    adCount?: number;
    duration?: number;
    expiresAt?: number | null;
    layout?: 'default' | 'header';
    headerTitle?: string;
    password?: string | null;
    maxClicks?: number | null;
    rotationDestinations?: string[] | null;
  };
}

export default function EditLink() {
  const { currentUser, roleSettings } = useAuth();
  const navigate = useNavigate();
  const { shortCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLink, setCurrentLink] = useState<LinkData | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Data States
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [customDomains, setCustomDomains] = useState<any[]>([]);

  const [settingsForm, setSettingsForm] = useState({
    adCount: 3,
    duration: 15,
    expiresIn: "never",
    layout: "default" as 'default' | 'header',
    headerTitle: "",
    tags: "",
    password: "",
    maxClicks: "",
    campaignId: "",
    customDomain: ""
  });

  useEffect(() => {
    if (!currentUser || !shortCode) return;

    const fetchData = async () => {
        try {
            // Fetch Link Data
            const linkRef = ref(db, `short_links/${shortCode}`);
            const snapshot = await get(linkRef);
            
            if (snapshot.exists()) {
                const link = snapshot.val();
                if (link.userId !== currentUser.uid) {
                    navigate('/links'); // Unauthorized
                    return;
                }
                setCurrentLink({ id: shortCode, ...link });
                
                // Initialize Form
                setSettingsForm({
                    adCount: link.settings?.adCount ?? 3,
                    duration: link.settings?.duration ?? 15,
                    expiresIn: "never", // Logic to determine this from expiresAt if needed
                    layout: link.settings?.layout ?? 'default',
                    headerTitle: link.settings?.headerTitle ?? "Valecraft",
                    tags: link.tags?.join(', ') || "",
                    password: link.settings?.password || "",
                    maxClicks: link.settings?.maxClicks ? String(link.settings.maxClicks) : "",
                    campaignId: link.campaignId || "",
                    customDomain: link.customDomain || ""
                });
            } else {
                navigate('/links'); // Not found
            }
        } catch (error) {
            console.error("Error fetching link:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();

    // Fetch Campaigns
    const campaignsRef = query(ref(db, "campaigns"), orderByChild("userId"), equalTo(currentUser.uid));
    const unsubscribeCampaigns = onValue(campaignsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setCampaigns(Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v })));
        } else {
            setCampaigns([]);
        }
    });

    // Fetch Custom Domains
    const domainsRef = query(ref(db, "custom_domains"), orderByChild("userId"), equalTo(currentUser.uid));
    const unsubscribeDomains = onValue(domainsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setCustomDomains(Object.entries(data).map(([k, v]: [string, any]) => ({ id: k, ...v })));
        } else {
            setCustomDomains([]);
        }
    });

    return () => {
        unsubscribeCampaigns();
        unsubscribeDomains();
    };
  }, [currentUser, shortCode, navigate]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSettings = async () => {
    if (!currentLink) return;
    setIsSubmitting(true);

    let expiresAt = null;
    const now = Date.now();
    if (settingsForm.expiresIn === "1h") expiresAt = now + 3600 * 1000;
    if (settingsForm.expiresIn === "24h") expiresAt = now + 24 * 3600 * 1000;
    if (settingsForm.expiresIn === "7d") expiresAt = now + 7 * 24 * 3600 * 1000;
    if (settingsForm.expiresIn === "30d") expiresAt = now + 30 * 24 * 3600 * 1000;

    const tagList = settingsForm.tags.split(',').map(t => t.trim()).filter(t => t);

    try {
        await update(ref(db, `short_links/${currentLink.shortCode}`), {
            tags: tagList,
            campaignId: settingsForm.campaignId || null,
            customDomain: settingsForm.customDomain || null
        });
        
        await update(ref(db, `short_links/${currentLink.shortCode}/settings`), {
            adCount: Number(settingsForm.adCount),
            duration: Math.max(15, Number(settingsForm.duration)),
            expiresAt: expiresAt,
            layout: settingsForm.layout,
            headerTitle: settingsForm.headerTitle,
            password: settingsForm.password || null,
            maxClicks: settingsForm.maxClicks ? parseInt(settingsForm.maxClicks) : null
        });
        showToast("Configurações salvas com sucesso!");
        setTimeout(() => navigate('/links'), 1000);
    } catch (err) {
        console.error("Failed to update settings", err);
        showToast("Erro ao salvar configurações", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/links')} className="p-2">
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                <span>Editar Link</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">/{currentLink?.shortCode}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Configurações Gerais</h3>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Tags</span></label>
                <input 
                type="text" 
                value={settingsForm.tags}
                onChange={(e) => setSettingsForm({...settingsForm, tags: e.target.value})}
                placeholder="marketing, social, promo (separadas por vírgula)"
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Campanha</label>
                    <select
                        value={settingsForm.campaignId}
                        onChange={(e) => setSettingsForm({...settingsForm, campaignId: e.target.value})}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                    >
                        <option value="">Nenhuma</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Domínio</label>
                    <select
                        value={settingsForm.customDomain}
                        onChange={(e) => setSettingsForm({...settingsForm, customDomain: e.target.value})}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                    >
                        <option value="">Padrão (valecraft.com)</option>
                        {customDomains.filter(d => d.verified).map(d => (
                            <option key={d.id} value={d.domain}>{d.domain}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Senha</label>
                    <input
                        type="text"
                        value={settingsForm.password}
                        onChange={(e) => setSettingsForm({...settingsForm, password: e.target.value})}
                        placeholder="Proteger link"
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Limite de Cliques</label>
                    <input
                        type="number"
                        value={settingsForm.maxClicks}
                        onChange={(e) => setSettingsForm({...settingsForm, maxClicks: e.target.value})}
                        placeholder="Ex: 100"
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Layout da Página</span></label>
                <select 
                value={settingsForm.layout}
                onChange={(e) => setSettingsForm({...settingsForm, layout: e.target.value as any})}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                >
                <option value="default">Padrão (Centralizado)</option>
                <option value="header">Cabeçalho (Nome + Contador no topo)</option>
                </select>
            </div>

            {settingsForm.layout === 'header' && (
                <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Título do Cabeçalho</span></label>
                <input 
                    type="text" 
                    value={settingsForm.headerTitle}
                    onChange={(e) => setSettingsForm({...settingsForm, headerTitle: e.target.value})}
                    placeholder="Ex: Valecraft"
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Quantidade de Anúncios</span></label>
                <select 
                value={settingsForm.adCount}
                onChange={(e) => setSettingsForm({...settingsForm, adCount: Number(e.target.value)})}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 disabled:bg-gray-100 disabled:text-gray-400"
                disabled={!roleSettings?.allowMonetization}
                title={!roleSettings?.allowMonetization ? "Upgrade para monetizar seus links" : ""}
                >
                <option value={0}>Sem Anúncios</option>
                <option value={1}>Baixo (1 Anúncio)</option>
                <option value={3}>Médio (3 Anúncios)</option>
                <option value={5}>Alto (5 Anúncios)</option>
                <option value={10}>Máximo (10 Anúncios)</option>
                </select>
                {!roleSettings?.allowMonetization && (
                    <p className="text-xs text-red-500 mt-1">Monetização não disponível no seu plano.</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Duração da Contagem (Segundos)</span></label>
                <select 
                value={settingsForm.duration}
                onChange={(e) => setSettingsForm({...settingsForm, duration: Number(e.target.value)})}
                className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                >
                  {Array.from({ length: 46 }, (_, i) => i + 15).map(seconds => (
                    <option key={seconds} value={seconds}>{seconds} segundos</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500"><span>Mínimo 15 segundos para validação segura.</span></p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700"><span>Expiração do Link</span></label>
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
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/links')}><span>Cancelar</span></Button>
            <Button className="flex-1" onClick={handleSaveSettings} isLoading={isSubmitting}><span>Salvar Alterações</span></Button>
        </div>
      </div>
    </div>
  );
}
