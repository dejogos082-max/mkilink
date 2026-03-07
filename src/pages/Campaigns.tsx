import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, push, set, onValue, remove, query, orderByChild, equalTo } from "firebase/database";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { motion, AnimatePresence } from "motion/react";
import { Folder, Plus, Trash2, Link as LinkIcon, X } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
  clicks: number;
  linkCount: number;
}

export default function Campaigns() {
  const { currentUser, roleSettings } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Check limits
  const isLimitReached = roleSettings && campaigns.length >= roleSettings.maxCampaigns;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const campaignsRef = query(
      ref(db, "campaigns"),
      orderByChild("userId"),
      equalTo(currentUser.uid)
    );

    const unsubscribe = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setCampaigns(list);
      } else {
        setCampaigns([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCampaignName.trim()) return;

    setIsSubmitting(true);
    try {
      const newRef = push(ref(db, "campaigns"));
      await set(newRef, {
        name: newCampaignName,
        userId: currentUser.uid,
        createdAt: Date.now(),
        clicks: 0,
        linkCount: 0
      });
      setNewCampaignName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;
    try {
      await remove(ref(db, `campaigns/${id}`));
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            <span>Campanhas</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Organize seus links em grupos para melhor rastreamento.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={isLimitReached}
          title={isLimitReached ? `Limite de ${roleSettings?.maxCampaigns} campanhas atingido.` : ""}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Nenhuma campanha encontrada</h3>
          <p className="text-gray-500 mt-1">Crie sua primeira campanha para organizar seus links.</p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-6" variant="outline">
            Criar Campanha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <Folder className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{campaign.name}</h3>
              <p className="text-xs text-gray-500 mb-6">Criado em {new Date(campaign.createdAt).toLocaleDateString()}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Links</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-gray-400" />
                    {campaign.linkCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Cliques</p>
                  <p className="text-lg font-bold text-gray-900">{campaign.clicks || 0}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
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
                <h3 className="text-lg font-bold text-gray-900">Nova Campanha</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
                <Input
                  label="Nome da Campanha"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Ex: Promoção de Verão, Instagram Ads..."
                  required
                />
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                    Criar
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
