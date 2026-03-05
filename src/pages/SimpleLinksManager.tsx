import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, set, onValue, query, orderByChild, equalTo, remove } from "firebase/database";
import { nanoid } from "nanoid";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, 
  ExternalLink, 
  Trash2, 
  BarChart2, 
  X, 
  Plus, 
  Search, 
  Filter,
  Zap,
  CheckCircle2,
  Check,
  ArrowLeft
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";

interface LinkData {
  id: string;
  originalUrl: string;
  shortCode: string;
  userId: string;
  createdAt: number;
  clicks: number;
  type?: string;
}

export default function SimpleLinksManager() {
  const { currentUser, roleConfig } = useAuth()!;
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form States
  const [url, setUrl] = useState("");
  const [rotationUrls, setRotationUrls] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete State
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks'>('createdAt');
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
        const linkList = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }))
          .filter((link: any) => link.type === 'simple'); // Only show simple links
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

      // Check limits
      if (roleConfig) {
        if (links.length >= roleConfig.maxShortLinks) {
          setFormError(`Você atingiu o limite de ${roleConfig.maxShortLinks} links curtos para o seu plano.`);
          setIsSubmitting(false);
          return;
        }
      }

      const shortCode = nanoid(6); // Always random for simple links per request? "com nome aleatório"
      const newLinkRef = ref(db, `short_links/${shortCode}`);
      
      const rotationList = rotationUrls.split('\n').map(u => u.trim()).filter(u => u);

      await set(newLinkRef, {
        originalUrl: url,
        shortCode,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        type: 'simple', // Mark as simple link
        settings: {
            rotationDestinations: rotationList.length > 0 ? rotationList : null
        }
      });

      setUrl("");
      setRotationUrls("");
      setIsCreateModalOpen(false);
      showToast("Link curto criado com sucesso!");
    } catch (err: any) {
      console.error(err);
      setFormError("Falha ao criar link. " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (shortCode: string) => {
    try {
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
    showToast("Link copiado!");
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
          <div className="flex items-center gap-2 mb-1">
            <RouterLink to="/links" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </RouterLink>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              <span>Links Curtos</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-7">Links de redirecionamento direto, sem anúncios ou espera.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-md shadow-amber-500/20">
          <Plus className="w-4 h-4 mr-2" />
          <span>Novo Link Curto</span>
        </Button>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código ou URL..."
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Carregando links...</p>
          </div>
        ) : filteredAndSortedLinks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum link curto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Crie links de redirecionamento instantâneo para compartilhar rapidamente.
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-amber-500 hover:bg-amber-600 border-transparent text-white">
                Criar Link Curto
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Destino</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliques</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Criado em</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
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
                          <span className="font-medium text-amber-600">/{link.shortCode}</span>
                          <button 
                            onClick={() => copyToClipboard(link.shortCode)}
                            className={`transition-colors flex items-center gap-1 ${copiedId === link.shortCode ? 'text-green-500 opacity-100' : 'text-gray-400 hover:text-amber-600 opacity-0 group-hover:opacity-100'}`}
                            title="Copiar Link"
                          >
                            {copiedId === link.shortCode ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[300px]">
                          <span className="text-sm text-gray-500 truncate" title={link.originalUrl}>
                            {link.originalUrl}
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
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setLinkToDelete(link.shortCode)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <h3 className="text-lg font-bold text-gray-900">Criar Link Curto</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateLink} className="p-6 space-y-4">
                <div className="bg-amber-50 p-4 rounded-xl text-sm text-amber-800 mb-4">
                  Links curtos redirecionam instantaneamente para o destino, sem exibir anúncios ou contadores.
                </div>

                <Input
                  label="URL de Destino"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                />
                
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Rotação de Links (Opcional)</label>
                    <textarea
                        value={rotationUrls}
                        onChange={(e) => setRotationUrls(e.target.value)}
                        placeholder="Uma URL por linha. O sistema irá alternar aleatoriamente entre a URL original e estas."
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 min-h-[80px]"
                    />
                </div>

                {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{formError}</p>}
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white border-transparent" isLoading={isSubmitting}>
                    Criar Link
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
                Tem certeza que deseja excluir este link permanentemente?
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setLinkToDelete(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" 
                  onClick={() => handleDelete(linkToDelete)}
                >
                  Excluir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
