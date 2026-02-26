import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue, query, orderByChild, equalTo, set, remove, get } from "firebase/database";
import { motion, AnimatePresence } from "motion/react";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink, 
  Layout, 
  Type, 
  Palette, 
  Smartphone,
  GripVertical,
  Star,
  Image as ImageIcon,
  Video,
  Globe,
  Lock,
  Copy,
  Check,
  Instagram,
  Youtube,
  Facebook,
  Gamepad2,
  Music,
  Twitter,
  Linkedin,
  Heart
} from "lucide-react";
import { Button } from "../components/Button";

type LinkType = 'custom' | 'instagram' | 'onlyfans' | 'youtube' | 'spotify' | 'facebook' | 'steam' | 'tiktok';

interface BioLink {
  id: string;
  title: string;
  url: string;
  type: LinkType;
  isHighlight: boolean;
  clicks: number;
}

interface BioTheme {
  backgroundType: 'color' | 'image' | 'video';
  backgroundValue: string;
  buttonStyle: 'rounded' | 'rounded-full' | 'sharp';
  buttonColor: string;
  buttonTextColor: string;
  textColor: string;
}

interface BioData {
  id: string;
  userId: string;
  title: string;
  subtitle?: string;
  description: string; // Bio
  avatarUrl: string;
  isPublic: boolean;
  theme: BioTheme;
  links: BioLink[];
  views: number;
}

const LINK_TYPES: { type: LinkType; label: string; icon: any }[] = [
  { type: 'custom', label: 'Link Personalizado', icon: Globe },
  { type: 'instagram', label: 'Instagram', icon: Instagram },
  { type: 'tiktok', label: 'TikTok', icon: Video }, // Using Video as placeholder if TikTok missing
  { type: 'youtube', label: 'YouTube', icon: Youtube },
  { type: 'spotify', label: 'Spotify', icon: Music },
  { type: 'facebook', label: 'Facebook', icon: Facebook },
  { type: 'steam', label: 'Steam', icon: Gamepad2 },
  { type: 'onlyfans', label: 'OnlyFans', icon: Heart },
];

export default function LinkBioManager() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bioData, setBioData] = useState<BioData | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Form States
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'settings'>('content');

  useEffect(() => {
    if (!currentUser) return;

    const bioRef = query(
      ref(db, "link_bios"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const unsubscribe = onValue(bioRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const key = Object.keys(data)[0];
        // Merge with default values to handle migrations/new fields
        const loadedData = data[key];
        const links = loadedData.links 
            ? (Array.isArray(loadedData.links) ? loadedData.links : Object.values(loadedData.links)) 
            : [];
            
        setBioData({
            ...loadedData,
            id: key,
            links,
            theme: {
                backgroundType: 'color',
                backgroundValue: '#f9fafb',
                buttonStyle: 'rounded',
                ...loadedData.theme
            },
            isPublic: loadedData.isPublic ?? true
        });
      } else {
        setBioData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateBio = async () => {
    if (!currentUser || !slugInput) return;
    const cleanSlug = slugInput.toLowerCase().replace(/[^a-z0-9-]/g, "");
    
    if (cleanSlug.length < 3) {
        setError("O link deve ter pelo menos 3 caracteres.");
        return;
    }

    setSaving(true);
    try {
        const slugRef = ref(db, `link_bios/${cleanSlug}`);
        const snapshot = await get(slugRef);
        
        if (snapshot.exists()) {
            setError("Este link já está em uso. Escolha outro.");
            setSaving(false);
            return;
        }

        const newBio: BioData = {
            id: cleanSlug,
            userId: currentUser.uid,
            title: "Meu Link Bio",
            subtitle: "Criador de Conteúdo",
            description: "Bem-vindo ao meu perfil oficial!",
            avatarUrl: "https://picsum.photos/200",
            isPublic: true,
            theme: {
                backgroundType: 'color',
                backgroundValue: "#f9fafb",
                buttonStyle: 'rounded',
                buttonColor: "#ffffff",
                buttonTextColor: "#111827",
                textColor: "#111827"
            },
            links: [],
            views: 0
        };

        await set(slugRef, newBio);
        setSlugInput("");
    } catch (e) {
        console.error(e);
        setError("Erro ao criar. Tente novamente.");
    } finally {
        setSaving(false);
    }
  };

  const handleUpdateBio = async (updatedData: Partial<BioData>) => {
    if (!bioData) return;
    // Optimistic update
    setBioData(prev => prev ? ({ ...prev, ...updatedData }) : null);
    
    // Debounce save or just save (for now direct save, maybe debounce in real app)
    try {
        await set(ref(db, `link_bios/${bioData.id}`), { ...bioData, ...updatedData });
    } catch (e) {
        console.error(e);
    }
  };

  const handleDeleteBio = async () => {
    if (!bioData || !window.confirm("Tem certeza? Isso apagará seu Link Bio permanentemente.")) return;
    setSaving(true);
    try {
        await remove(ref(db, `link_bios/${bioData.id}`));
        setBioData(null);
    } catch (e) {
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  const addLink = (type: LinkType = 'custom') => {
    if (!bioData) return;
    const newLink: BioLink = {
        id: Date.now().toString(),
        title: type === 'custom' ? "Novo Link" : type.charAt(0).toUpperCase() + type.slice(1),
        url: "https://",
        type,
        isHighlight: false,
        clicks: 0
    };
    const updatedLinks = [...(bioData.links || []), newLink];
    handleUpdateBio({ links: updatedLinks });
  };

  const updateLink = (index: number, field: keyof BioLink, value: any) => {
    if (!bioData || !bioData.links) return;
    const updatedLinks = [...bioData.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleUpdateBio({ links: updatedLinks });
  };

  const removeLink = (index: number) => {
    if (!bioData || !bioData.links) return;
    const updatedLinks = bioData.links.filter((_, i) => i !== index);
    handleUpdateBio({ links: updatedLinks });
  };
  
  const moveLink = (index: number, direction: 'up' | 'down') => {
      if (!bioData || !bioData.links) return;
      const newLinks = [...bioData.links];
      if (direction === 'up' && index > 0) {
          [newLinks[index], newLinks[index - 1]] = [newLinks[index - 1], newLinks[index]];
      } else if (direction === 'down' && index < newLinks.length - 1) {
          [newLinks[index], newLinks[index + 1]] = [newLinks[index + 1], newLinks[index]];
      }
      handleUpdateBio({ links: newLinks });
  };

  const copyToClipboard = () => {
      if (!bioData) return;
      const url = `${window.location.origin}/bio/${bioData.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  // Creation View
  if (!bioData) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layout className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crie seu Link Bio</h1>
        <p className="text-gray-500 mb-8">
            Tenha uma página única para todos os seus links importantes. Rápido, bonito e otimizado para conversão.
        </p>
        
        <div className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escolha seu endereço</label>
                <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        app.com/bio/
                    </span>
                    <input
                        type="text"
                        value={slugInput}
                        onChange={(e) => {
                            setSlugInput(e.target.value);
                            setError("");
                        }}
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="seu-nome"
                    />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            
            <Button onClick={handleCreateBio} disabled={saving} className="w-full">
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Criar Página"}
            </Button>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
        {/* Editor Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bioData.isPublic ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-mono font-bold text-indigo-600">/{bioData.id}</span>
                    <a href={`/bio/${bioData.id}`} target="_blank" rel="noreferrer" className="ml-2 text-gray-400 hover:text-indigo-600">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Copiar Link</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDeleteBio} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'content' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Type className="inline-block w-4 h-4 mr-2" />
                    Conteúdo
                </button>
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Palette className="inline-block w-4 h-4 mr-2" />
                    Aparência
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Lock className="inline-block w-4 h-4 mr-2" />
                    Configurações
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {activeTab === 'content' ? (
                    <>
                        {/* Profile Section */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Perfil</h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Foto de Perfil (URL)</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 relative group">
                                            <img src={bioData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                <ImageIcon className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <input 
                                                type="text" 
                                                value={bioData.avatarUrl}
                                                onChange={(e) => handleUpdateBio({ avatarUrl: e.target.value })}
                                                className="flex-1 text-sm border-gray-300 rounded-lg"
                                                placeholder="https://..."
                                            />
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        setSaving(true);
                                                        // Get presigned URL
                                                        const res = await fetch('/api/upload-url', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                filename: file.name,
                                                                contentType: file.type
                                                            })
                                                        });
                                                        
                                                        if (!res.ok) throw new Error('Failed to get upload URL');
                                                        const { uploadUrl, publicUrl } = await res.json();

                                                        // Upload to R2
                                                        await fetch(uploadUrl, {
                                                            method: 'PUT',
                                                            body: file,
                                                            headers: { 'Content-Type': file.type }
                                                        });

                                                        handleUpdateBio({ avatarUrl: publicUrl });
                                                    } catch (err) {
                                                        console.error(err);
                                                        setError("Erro ao fazer upload da imagem.");
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}
                                            />
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                onClick={() => document.getElementById('avatar-upload')?.click()}
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Título</label>
                                        <input 
                                            type="text" 
                                            value={bioData.title}
                                            onChange={(e) => handleUpdateBio({ title: e.target.value })}
                                            className="w-full text-sm border-gray-300 rounded-lg font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Subtítulo</label>
                                        <input 
                                            type="text" 
                                            value={bioData.subtitle || ""}
                                            onChange={(e) => handleUpdateBio({ subtitle: e.target.value })}
                                            className="w-full text-sm border-gray-300 rounded-lg"
                                            placeholder="Opcional"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Bio / Descrição</label>
                                    <textarea 
                                        value={bioData.description}
                                        onChange={(e) => handleUpdateBio({ description: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-lg"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Links Section */}
                        <section className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Links</h3>
                                <div className="flex gap-2">
                                    <select 
                                        className="text-sm border-gray-300 rounded-lg"
                                        onChange={(e) => {
                                            if(e.target.value) {
                                                addLink(e.target.value as LinkType);
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="">+ Adicionar Link</option>
                                        {LINK_TYPES.map(t => (
                                            <option key={t.type} value={t.type}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {bioData.links?.map((link, index) => (
                                        <motion.div 
                                            key={link.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-gray-50 p-4 rounded-xl border border-gray-200 group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col gap-1 mt-2 text-gray-400">
                                                    <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="hover:text-indigo-600 disabled:opacity-30">▲</button>
                                                    <button onClick={() => moveLink(index, 'down')} disabled={index === (bioData.links.length - 1)} className="hover:text-indigo-600 disabled:opacity-30">▼</button>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold uppercase text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                                                            {link.type}
                                                        </span>
                                                        <input 
                                                            type="text" 
                                                            value={link.title}
                                                            onChange={(e) => updateLink(index, 'title', e.target.value)}
                                                            className="flex-1 text-sm font-bold border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                            placeholder="Título do botão"
                                                        />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={link.url}
                                                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                                                        className="w-full text-xs text-gray-500 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="https://..."
                                                    />
                                                    <div className="flex items-center gap-4 pt-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={link.isHighlight}
                                                                onChange={(e) => updateLink(index, 'isHighlight', e.target.checked)}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500" 
                                                            />
                                                            <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                                <Star className="h-3 w-3" /> Destaque (Botão Grande)
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeLink(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {(!bioData.links || bioData.links.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        Nenhum link adicionado ainda.
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : activeTab === 'appearance' ? (
                    <section className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Personalização</h3>
                        
                        {/* Background Settings */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Fundo da Página</label>
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, backgroundType: 'color' } })}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${bioData.theme.backgroundType === 'color' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Cor Sólida
                                </button>
                                <button 
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, backgroundType: 'image' } })}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${bioData.theme.backgroundType === 'image' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Imagem
                                </button>
                                <button 
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, backgroundType: 'video' } })}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${bioData.theme.backgroundType === 'video' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Vídeo
                                </button>
                            </div>

                            {bioData.theme.backgroundType === 'color' ? (
                                <div className="flex gap-3 flex-wrap">
                                    {['#f9fafb', '#ffffff', '#111827', '#fdf2f8', '#eff6ff', '#f0fdf4', '#1e1b4b'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => handleUpdateBio({ theme: { ...bioData.theme, backgroundValue: color } })}
                                            className={`w-10 h-10 rounded-full border-2 ${bioData.theme.backgroundValue === color ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input 
                                        type="color" 
                                        value={bioData.theme.backgroundValue}
                                        onChange={(e) => handleUpdateBio({ theme: { ...bioData.theme, backgroundValue: e.target.value } })}
                                        className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500">URL do {bioData.theme.backgroundType === 'image' ? 'Imagem' : 'Vídeo (MP4)'}</label>
                                    <input 
                                        type="text" 
                                        value={bioData.theme.backgroundValue}
                                        onChange={(e) => handleUpdateBio({ theme: { ...bioData.theme, backgroundValue: e.target.value } })}
                                        className="w-full text-sm border-gray-300 rounded-lg"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Button Style */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estilo dos Botões</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonStyle: 'rounded' } })}
                                    className={`px-4 py-2 rounded-lg border text-sm ${bioData.theme.buttonStyle === 'rounded' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Arredondado
                                </button>
                                <button
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonStyle: 'rounded-full' } })}
                                    className={`px-4 py-2 rounded-full border text-sm ${bioData.theme.buttonStyle === 'rounded-full' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Pílula
                                </button>
                                <button
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonStyle: 'sharp' } })}
                                    className={`px-4 py-2 border text-sm ${bioData.theme.buttonStyle === 'sharp' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}
                                >
                                    Quadrado
                                </button>
                            </div>
                        </div>

                        {/* Button Colors */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor dos Botões</label>
                            <div className="flex gap-3 flex-wrap">
                                {['#ffffff', '#111827', '#4f46e5', '#db2777', '#16a34a'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonColor: color } })}
                                        className={`w-10 h-10 rounded-full border-2 ${bioData.theme.buttonColor === color ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <input 
                                    type="color" 
                                    value={bioData.theme.buttonColor}
                                    onChange={(e) => handleUpdateBio({ theme: { ...bioData.theme, buttonColor: e.target.value } })}
                                    className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto (Botões)</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonTextColor: '#111827' } })}
                                    className={`px-4 py-2 rounded-lg border ${bioData.theme.buttonTextColor === '#111827' ? 'bg-gray-100 border-gray-400' : 'border-gray-200'}`}
                                >
                                    Escuro
                                </button>
                                <button
                                    onClick={() => handleUpdateBio({ theme: { ...bioData.theme, buttonTextColor: '#ffffff' } })}
                                    className={`px-4 py-2 rounded-lg border ${bioData.theme.buttonTextColor === '#ffffff' ? 'bg-gray-800 text-white border-gray-900' : 'border-gray-200'}`}
                                >
                                    Claro
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto (Página)</label>
                            <input 
                                type="color" 
                                value={bioData.theme.textColor}
                                onChange={(e) => handleUpdateBio({ theme: { ...bioData.theme, textColor: e.target.value } })}
                                className="w-full h-10 p-1 border border-gray-300 rounded-lg"
                            />
                        </div>
                    </section>
                ) : (
                    <section className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Configurações</h3>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Visibilidade da Página</h4>
                                    <p className="text-sm text-gray-500">Defina se sua página é pública ou privada.</p>
                                </div>
                                <button 
                                    onClick={() => handleUpdateBio({ isPublic: !bioData.isPublic })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bioData.isPublic ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bioData.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="mt-2 text-xs font-medium">
                                Status: <span className={bioData.isPublic ? "text-green-600" : "text-red-600"}>{bioData.isPublic ? "PÚBLICO" : "PRIVADO"}</span>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    </div>
  );
}
