import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, push, set, onValue, query, orderByChild, equalTo, remove, update, runTransaction } from "firebase/database";
import { nanoid } from "nanoid";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Zap,
  Tag,
  Globe,
  QrCode
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

import { QRCodeCanvas } from "qrcode.react";
import { isNativeAppMode } from "../utils/nativeMode";

export default function LinksManager() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Data States
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [customDomains, setCustomDomains] = useState<any[]>([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState<LinkData | null>(null);
  
  // Form States
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [tags, setTags] = useState(""); // Comma separated tags
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Form Fields
  const [password, setPassword] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");

  // Edit States
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Search & Filter

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks' | 'shortCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  // Bulk Actions
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper to extract domain
  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  // Derived lists for filters
  const uniqueDomains = Array.from(new Set(links.map(link => getDomain(link.originalUrl)))).sort();
  const uniqueTags = Array.from(new Set(links.flatMap(link => link.tags || []))).sort();

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Links
    const linksRef = query(
      ref(db, "short_links"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const unsubscribeLinks = onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linkList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        })).filter((link: any) => link.type !== 'simple');
        setLinks(linkList);
      } else {
        setLinks([]);
      }
      setLoading(false);
    });

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
        unsubscribeLinks();
        unsubscribeCampaigns();
        unsubscribeDomains();
    };
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
      
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t);

      await set(newLinkRef, {
        originalUrl: url,
        shortCode,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        tags: tagList,
        campaignId: selectedCampaign || null,
        customDomain: selectedDomain || null,
        settings: {
            adCount: 3,
            duration: 15,
            expiresAt: null,
            password: password || null,
            maxClicks: maxClicks ? parseInt(maxClicks) : null
        }
      });

      // Update Campaign Link Count
      if (selectedCampaign) {
        const campaignRef = ref(db, `campaigns/${selectedCampaign}`);
        runTransaction(campaignRef, (campaign) => {
            if (campaign) {
                campaign.links = (campaign.links || 0) + 1;
            }
            return campaign;
        });
      }

      setUrl("");
      setCustomAlias("");
      setTags("");
      setPassword("");
      setMaxClicks("");
      setSelectedCampaign("");
      setSelectedDomain("");
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

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selectedLinks).map(shortCode => 
        Promise.all([
          remove(ref(db, `short_links/${shortCode}`)),
          remove(ref(db, `click_stats/${shortCode}`))
        ])
      );
      
      await Promise.all(promises);
      showToast(`${selectedLinks.size} links excluídos com sucesso!`);
      setSelectedLinks(new Set());
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to bulk delete", err);
      showToast("Erro ao excluir links", "error");
    }
  };

  const toggleSelectAll = () => {
    if (selectedLinks.size === filteredAndSortedLinks.length) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(new Set(filteredAndSortedLinks.map(l => l.shortCode)));
    }
  };

  const toggleSelectLink = (shortCode: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(shortCode)) {
      newSelected.delete(shortCode);
    } else {
      newSelected.add(shortCode);
    }
    setSelectedLinks(newSelected);
  };

  const copyToClipboard = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shortCode);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Link copiado para a área de transferência!");
  };

  const openEditModal = (link: LinkData) => {
    const prefix = isNativeAppMode() ? '/appnativo' : '';
    navigate(`${prefix}/links/edit/${link.shortCode}`);
  };

  const filteredAndSortedLinks = links
    .filter((link) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        link.shortCode.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query) ||
        link.tags?.some(tag => tag.toLowerCase().includes(query));

      const matchesDomain = filterDomain === 'all' || getDomain(link.originalUrl) === filterDomain;
      const matchesTag = filterTag === 'all' || link.tags?.includes(filterTag);
      
      let matchesDate = true;
      if (filterDateStart) {
        matchesDate = matchesDate && link.createdAt >= new Date(filterDateStart).getTime();
      }
      if (filterDateEnd) {
        // Add 1 day to include the end date fully
        matchesDate = matchesDate && link.createdAt <= new Date(filterDateEnd).getTime() + 86400000;
      }

      return matchesSearch && matchesDomain && matchesTag && matchesDate;
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
        <div className="flex gap-2">
          <Button onClick={() => navigate(isNativeAppMode() ? '/appnativo/simple-links' : '/simple-links')} className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-md shadow-amber-500/20">
            <Zap className="w-4 h-4 mr-2" />
            <span>Links Curtos</span>
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0 shadow-md shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" />
            <span>Novo Link</span>
          </Button>
        </div>
      </div>

      {/* Bulk Actions & Filters */}
      <div className="space-y-4">
        <AnimatePresence>
          {selectedLinks.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {selectedLinks.size}
                  </div>
                  <span className="text-sm font-medium text-indigo-900">links selecionados</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedLinks(new Set())}
                    className="text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white border-transparent shadow-sm shadow-red-600/20"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Selecionados
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white p-1 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <div className="p-3 space-y-3">
            {/* Top Row: Search and Sort */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por alias, URL ou tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl text-sm transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                 <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 pr-3 border border-transparent focus-within:bg-white focus-within:border-indigo-500 transition-all duration-200">
                  <div className="pl-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer py-1.5 pl-1 pr-6"
                  >
                    <option value="createdAt">Data</option>
                    <option value="clicks">Cliques</option>
                    <option value="shortCode">A-Z</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
              <div className="flex-1 grid grid-cols-2 sm:flex gap-3">
                <div className="relative min-w-[140px]">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 appearance-none hover:border-gray-300 transition-colors"
                  >
                    <option value="all">Todos Domínios</option>
                    {uniqueDomains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div className="relative min-w-[140px]">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 appearance-none hover:border-gray-300 transition-colors"
                  >
                    <option value="all">Todas Tags</option>
                    {uniqueTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 px-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="date" 
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="border-0 text-xs focus:ring-0 text-gray-600 bg-transparent p-1 w-24"
                  placeholder="Início"
                />
                <span className="text-gray-300">→</span>
                <input 
                  type="date" 
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="border-0 text-xs focus:ring-0 text-gray-600 bg-transparent p-1 w-24"
                  placeholder="Fim"
                />
                {(filterDateStart || filterDateEnd) && (
                  <button 
                    onClick={() => { setFilterDateStart(""); setFilterDateEnd(""); }}
                    className="ml-1 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
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
                  <th className="px-6 py-4 w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedLinks.size === filteredAndSortedLinks.length && filteredAndSortedLinks.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Link Curto</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Destino Original</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cliques</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Criado em</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {filteredAndSortedLinks.map((link) => (
                    <motion.tr 
                      key={link.shortCode}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={`group transition-all duration-200 ${selectedLinks.has(link.shortCode) ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedLinks.has(link.shortCode)}
                          onChange={() => toggleSelectLink(link.shortCode)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                              <span className="font-semibold text-sm">/{link.shortCode}</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(link.shortCode)}
                              className={`p-1 rounded-md transition-all duration-200 ${copiedId === link.shortCode ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'}`}
                              title="Copiar Link"
                            >
                              {copiedId === link.shortCode ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {link.settings?.expiresAt && Date.now() > link.settings.expiresAt && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded-full border border-red-200">
                                Expirado
                              </span>
                            )}
                          </div>
                          {link.tags && link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {link.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[300px]">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 truncate font-medium" title={link.originalUrl}>
                              {link.originalUrl}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {getDomain(link.originalUrl)}
                            </p>
                          </div>
                          <a 
                            href={link.originalUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${link.clicks > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            <BarChart2 className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{link.clicks.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-600">{new Date(link.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(link.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                            onClick={() => { setQrLink(link); setIsQrModalOpen(true); }}
                          >
                            <QrCode className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs font-medium">QR Code</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100"
                            onClick={() => openEditModal(link)}
                          >
                            <Settings className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs font-medium">Editar</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                            onClick={() => setLinkToDelete(link.shortCode)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                <Input
                  label="Tags (Opcional)"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="marketing, social, promo (separadas por vírgula)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Campanha</label>
                        <select
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
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
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
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
                    <Input
                        label="Senha (Opcional)"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Proteger link"
                    />
                    <Input
                        label="Limite de Cliques"
                        type="number"
                        value={maxClicks}
                        onChange={(e) => setMaxClicks(e.target.value)}
                        placeholder="Ex: 100"
                    />
                </div>
                
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

      {/* QR Code Modal */}
      <AnimatePresence>
        {isQrModalOpen && qrLink && (
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">QR Code</h3>
                <button onClick={() => setIsQrModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl shadow-inner border border-gray-100">
                <QRCodeCanvas 
                    value={`${window.location.origin}/${qrLink.shortCode}`} 
                    size={200}
                    level={"H"}
                    includeMargin={true}
                />
              </div>
              
              <p className="text-sm text-gray-500 mb-6 break-all">
                {`${window.location.origin}/${qrLink.shortCode}`}
              </p>

              <Button 
                className="w-full" 
                onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                        const url = canvas.toDataURL('image/png');
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `qrcode-${qrLink.shortCode}.png`;
                        a.click();
                    }
                }}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Baixar PNG
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
