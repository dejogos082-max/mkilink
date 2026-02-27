import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, push, set, onValue, query, orderByChild, equalTo, remove, update } from "firebase/database";
import { nanoid } from "nanoid";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, 
  ExternalLink, 
  Trash2, 
  BarChart2, 
  Calendar, 
  Settings, 
  X, 
  Plus, 
  Search, 
  Filter,
  Link as LinkIcon,
  MoreVertical,
  CheckCircle2,
  Check
} from "lucide-react";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  userId: string;
  createdAt: number;
  clicks: number;
  settings?: {
    adCount?: number;
    duration?: number;
    expiresAt?: number | null;
    layout?: 'default' | 'header';
    headerTitle?: string;
  };
}

export default function LinksManager() {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form States
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit States
  const [currentLink, setCurrentLink] = useState<LinkData | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    adCount: 3,
    duration: 15,
    expiresIn: "never",
    layout: "default" as 'default' | 'header',
    headerTitle: "",
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks' | 'shortCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Toast
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        setLinks(linkList);
      } else {
        setLinks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setFormError("");
      setIsSubmitting(true);

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
      setIsCreateModalOpen(false);
      showToast("Link criado com sucesso!");
    } catch (err: any) {
      console.error(err);
      setFormError("Falha ao criar link. " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shortCode: string) => {
    try {
      // Delete link and its stats
      await Promise.all([
        remove(ref(db, `short_links/${shortCode}`)),
        remove(ref(db, `click_stats/${shortCode}`))
      ]);
      showToast("Link excluído com sucesso!");
      setLinkToDelete(null);
    } catch (err) {
      console.error("Failed to delete", err);
      showToast("Erro ao excluir link", "error");
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shortCode);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Link copiado para a área de transferência!");
  };

  const openEditModal = (link: LinkData) => {
    setCurrentLink(link);
    setSettingsForm({
        adCount: link.settings?.adCount ?? 3,
        duration: link.settings?.duration ?? 15,
        expiresIn: "never",
        layout: link.settings?.layout ?? 'default',
        headerTitle: link.settings?.headerTitle ?? "Valecraft"
    });
    setIsEditModalOpen(true);
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

    try {
        await update(ref(db, `short_links/${currentLink.shortCode}/settings`), {
            adCount: Number(settingsForm.adCount),
            duration: Math.max(15, Number(settingsForm.duration)),
            expiresAt: expiresAt,
            layout: settingsForm.layout,
            headerTitle: settingsForm.headerTitle
        });
        setIsEditModalOpen(false);
        showToast("Configurações salvas com sucesso!");
    } catch (err) {
        console.error("Failed to update settings", err);
        showToast("Erro ao salvar configurações", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredAndSortedLinks = links
    .filter((link) => {
      const query = searchQuery.toLowerCase();
      return (
        link.shortCode.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'createdAt') comparison = a.createdAt - b.createdAt;
      else if (sortBy === 'clicks') comparison = a.clicks - b.clicks;
      else if (sortBy === 'shortCode') comparison = a.shortCode.localeCompare(b.shortCode);
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-8 pb-12">
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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-indigo-600" />
            <span>Gerenciador de Links</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1"><span>Crie, edite e acompanhe todos os seus links curtos.</span></p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0 shadow-md shadow-indigo-500/20">
          <Plus className="w-4 h-4 mr-2" />
          <span>Novo Link</span>
        </Button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por alias ou URL original..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none"
            >
              <option value="createdAt">Data de Criação</option>
              <option value="clicks">Mais Clicados</option>
              <option value="shortCode">Ordem Alfabética</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="px-3 py-2.5 bg-white border-gray-200 shadow-sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Links Data Grid */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Carregando links...</p>
          </div>
        ) : filteredAndSortedLinks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <LinkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum link encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              {searchQuery ? "Tente ajustar sua busca." : "Você ainda não criou nenhum link curto. Clique em 'Novo Link' para começar."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6" variant="outline">
                Criar meu primeiro link
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"><span>Link Curto</span></th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell"><span>Destino Original</span></th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"><span>Cliques</span></th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell"><span>Criado em</span></th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right"><span>Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredAndSortedLinks.map((link) => (
                    <motion.tr 
                      key={link.shortCode}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-indigo-600"><span>/{link.shortCode}</span></span>
                          <button 
                            onClick={() => copyToClipboard(link.shortCode)}
                            className={`transition-colors flex items-center gap-1 ${copiedId === link.shortCode ? 'text-green-500 opacity-100' : 'text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100'}`}
                            title="Copiar Link"
                          >
                            {copiedId === link.shortCode ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Copiado!</span>
                              </>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {link.settings?.expiresAt && Date.now() > link.settings.expiresAt && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded-full">
                              <span>Expirado</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[300px]">
                          <span className="text-sm text-gray-500 truncate" title={link.originalUrl}>
                            <span>{link.originalUrl}</span>
                          </span>
                          <a href={link.originalUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600 shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <BarChart2 className="w-4 h-4 text-gray-400" />
                          <span>{link.clicks.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell text-sm text-gray-500">
                        <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => openEditModal(link)}
                          >
                            <Settings className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline"><span>Editar</span></span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setLinkToDelete(link.shortCode)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      <AnimatePresence>
        {linkToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Link</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir este link permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setLinkToDelete(null)}>
                  <span>Cancelar</span>
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" 
                  onClick={() => handleDelete(linkToDelete)}
                >
                  <span>Excluir</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900"><span>Criar Novo Link</span></h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateLink} className="p-6 space-y-4">
                <Input
                  label="URL de Destino"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com/url/muito/longa"
                />
                <Input
                  label="Alias Personalizado (Opcional)"
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="meu-link-personalizado"
                  pattern="[a-zA-Z0-9-_]+"
                  title="Apenas letras, números, hífens e sublinhados permitidos"
                />
                
                {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg"><span>{formError}</span></p>}
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                    <span>Cancelar</span>
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                    <span>Criar Link</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Settings Modal */}
      <AnimatePresence>
        {isEditModalOpen && currentLink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900"><span>Configurações do Link</span></h3>
                  <p className="text-xs text-indigo-600 font-medium mt-1"><span>/{currentLink.shortCode}</span></p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
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
                  <label className="text-sm font-medium text-gray-700"><span>Duração da Contagem (Segundos)</span></label>
                  <input 
                    type="number" 
                    min="15"
                    max="60"
                    value={settingsForm.duration}
                    onChange={(e) => setSettingsForm({...settingsForm, duration: Math.max(15, Number(e.target.value))})}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                  />
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
                <Button variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(false)}><span>Cancelar</span></Button>
                <Button className="flex-1" onClick={handleSaveSettings} isLoading={isSubmitting}><span>Salvar Alterações</span></Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
