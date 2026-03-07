import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { motion } from "motion/react";
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  BarChart3,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function ManagePlan() {
  const { currentUser, role, roleSettings } = useAuth()!;
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const subRef = ref(db, `users/${currentUser.uid}/subscription`);
      onValue(subRef, (snapshot) => {
        if (snapshot.exists()) {
          setSubscription(snapshot.val());
        }
        setLoading(false);
      });
    }
  }, [currentUser]);

  const getPlanName = (role: string | null) => {
    switch (role) {
      case 'UserPremium': return 'Workspace Premium';
      case 'UserEnterprise': return 'Workspace Enterprise';
      case 'AdminUser': return 'Administrador';
      default: return 'Plano Gratuito';
    }
  };

  const getDaysRemaining = () => {
    if (!subscription || !subscription.startDate) return null;
    
    const startDate = new Date(subscription.startDate);
    const now = new Date();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const elapsed = now.getTime() - startDate.getTime();
    const remaining = thirtyDaysInMs - elapsed;
    
    if (remaining <= 0) return 0;
    
    return Math.ceil(remaining / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold tracking-tight text-gray-900"
        >
          Gerenciar Plano
        </motion.h1>
        <p className="text-gray-500">Detalhes da sua assinatura e estatísticas de uso.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Details Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard className="w-32 h-32 text-indigo-600" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Seu Plano Atual</h2>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Plano Ativo</p>
                <h3 className="text-2xl font-bold text-indigo-600">{getPlanName(role)}</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Início</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex-1 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Renovação</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {daysRemaining !== null ? `Em ${daysRemaining} dias` : 'Vitalício / Indefinido'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status da Assinatura</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Usage Stats Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Limites e Uso</h2>
          </div>

          <div className="space-y-4">
            {roleSettings && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Links Curtos</span>
                    <span className="font-medium text-gray-900">{roleSettings.maxShortLinks === 9999 ? 'Ilimitado' : roleSettings.maxShortLinks}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-full opacity-20" /> 
                    {/* Note: To show real usage, we'd need to fetch count of user's links. For now showing capacity. */}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Links Avançados</span>
                    <span className="font-medium text-gray-900">{roleSettings.maxAdvancedLinks === 9999 ? 'Ilimitado' : roleSettings.maxAdvancedLinks}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-full opacity-20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Campanhas</span>
                    <span className="font-medium text-gray-900">{roleSettings.maxCampaigns === 9999 ? 'Ilimitado' : roleSettings.maxCampaigns}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full w-full opacity-20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Páginas de Bio</span>
                    <span className="font-medium text-gray-900">{roleSettings.maxBioPages === 9999 ? 'Ilimitado' : roleSettings.maxBioPages}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full w-full opacity-20" />
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
               <div className="flex items-center gap-2 text-sm text-gray-600">
                 {roleSettings?.allowAutoQrCode ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                 <span>QR Code Auto</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600">
                 {roleSettings?.allowMonetization ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                 <span>Monetização</span>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upgrade Banner (if not Enterprise) */}
      {role !== 'UserEnterprise' && role !== 'AdminUser' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Faça um Upgrade do seu Plano</h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Desbloqueie recursos ilimitados, monetização e muito mais com o plano Enterprise.
            </p>
            <button className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              Ver Planos Disponíveis
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-400 rounded-full blur-3xl" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
