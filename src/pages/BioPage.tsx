import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, get, runTransaction } from "firebase/database";
import { motion } from "motion/react";
import { 
  Loader2, 
  ExternalLink, 
  Share2,
  Instagram,
  Youtube,
  Facebook,
  Gamepad2,
  Music,
  Video,
  Globe,
  Heart,
  Lock
} from "lucide-react";

type LinkType = 'custom' | 'instagram' | 'onlyfans' | 'youtube' | 'spotify' | 'facebook' | 'steam' | 'tiktok';

interface BioLink {
  id: string;
  title: string;
  url: string;
  type: LinkType;
  isHighlight: boolean;
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
  title: string;
  subtitle?: string;
  description: string;
  avatarUrl: string;
  isPublic: boolean;
  theme: BioTheme;
  links: BioLink[];
}

export default function BioPage() {
  const { slug } = useParams();
  const [data, setData] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const bioRef = ref(db, `link_bios/${slug}`);
        const snapshot = await get(bioRef);
        
        if (snapshot.exists()) {
          const val = snapshot.val();
          
          // Check visibility
          if (val.isPublic === false) {
              setError("Este perfil é privado.");
              setLoading(false);
              return;
          }

          const links = val.links 
            ? (Array.isArray(val.links) ? val.links : Object.values(val.links)) 
            : [];

          setData({
              ...val,
              links,
              theme: {
                  backgroundType: 'color',
                  backgroundValue: '#f9fafb',
                  buttonStyle: 'rounded',
                  ...val.theme
              }
          });
          
          // Increment View Count
          runTransaction(ref(db, `link_bios/${slug}/views`), (views) => {
            return (views || 0) + 1;
          });
        } else {
          setError("Página não encontrada.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar página.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleLinkClick = (linkId: string, url: string) => {
    // Track click (optional: add detailed stats later)
    runTransaction(ref(db, `link_bios/${slug}/links/${linkId}/clicks`), (clicks) => {
        return (clicks || 0) + 1;
    });
    
    // Allow animation to play before redirect
    setTimeout(() => {
        window.location.href = url;
    }, 150);
  };

  const getIcon = (type: LinkType) => {
      switch (type) {
          case 'instagram': return <Instagram className="w-5 h-5" />;
          case 'youtube': return <Youtube className="w-5 h-5" />;
          case 'facebook': return <Facebook className="w-5 h-5" />;
          case 'tiktok': return <Video className="w-5 h-5" />;
          case 'spotify': return <Music className="w-5 h-5" />;
          case 'steam': return <Gamepad2 className="w-5 h-5" />;
          case 'onlyfans': return <Heart className="w-5 h-5" />;
          default: return null; // Custom links might not need an icon or use a generic one if desired
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
            <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Indisponível</h1>
            <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans selection:bg-black/10 relative overflow-hidden"
      style={{ 
        backgroundColor: data.theme.backgroundType === 'color' ? data.theme.backgroundValue : 'black',
        color: data.theme.textColor
      }}
    >
      {/* Background Media */}
      {data.theme.backgroundType === 'image' && (
        <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${data.theme.backgroundValue})` }}
        />
      )}
      {data.theme.backgroundType === 'video' && (
        <video 
            src={data.theme.backgroundValue}
            className="absolute inset-0 w-full h-full object-cover z-0"
            autoPlay loop muted playsInline
        />
      )}
      
      {/* Overlay */}
      {data.theme.backgroundType !== 'color' && (
        <div className="absolute inset-0 bg-black/40 z-0" />
      )}

      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mt-8 mb-10"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden mb-6 ring-4 ring-white/20 shadow-xl">
            <img 
              src={data.avatarUrl} 
              alt={data.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">{data.title}</h1>
          {data.subtitle && <p className="text-lg font-medium opacity-90 mb-2">{data.subtitle}</p>}
          <p className="text-base opacity-80 max-w-xs leading-relaxed">
            {data.description}
          </p>
        </motion.div>

        {/* Links */}
        <div className="flex-1 space-y-4 w-full">
          {data.links?.map((link, index) => (
            <motion.button
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLinkClick(link.id, link.url)}
              className={`
                w-full relative group overflow-hidden p-4 flex items-center justify-center text-center shadow-sm transition-all 
                ${link.isHighlight ? 'py-5 shadow-md' : ''}
                ${data.theme.buttonStyle === 'rounded-full' ? 'rounded-full' : data.theme.buttonStyle === 'sharp' ? 'rounded-none' : 'rounded-2xl'}
              `}
              style={{ 
                backgroundColor: data.theme.buttonColor,
                color: data.theme.buttonTextColor
              }}
            >
              {/* Icon */}
              {link.type !== 'custom' && (
                  <span className="absolute left-5 opacity-80">
                      {getIcon(link.type)}
                  </span>
              )}

              <span className={`font-bold ${link.isHighlight ? 'text-lg' : 'text-base'}`}>
                {link.title}
              </span>
              
              {/* Highlight Effect */}
              {link.isHighlight && (
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              
              <ExternalLink className={`absolute right-5 w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity ${data.theme.buttonTextColor === '#ffffff' ? 'text-white' : 'text-black'}`} />
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 mb-6 text-center"
        >
          <a href="/" className="inline-flex items-center gap-2 text-xs font-medium opacity-40 hover:opacity-100 transition-opacity">
             <span>MKI Links PRO</span>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
