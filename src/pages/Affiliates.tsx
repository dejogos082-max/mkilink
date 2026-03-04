import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, query, orderByChild, equalTo, onValue } from "firebase/database";
import { Users, DollarSign, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { motion } from "motion/react";

export default function Affiliates() {
  const { currentUser } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Referral code is just the user ID for simplicity, or we can generate a unique one.
  // Using user ID is easiest and unique.
  const referralCode = currentUser?.uid;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (!currentUser) return;

    // Fetch users who registered with this referral code
    const usersRef = query(
      ref(db, "users"),
      orderByChild("referredBy"),
      equalTo(currentUser.uid)
    );

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setReferrals(list);
        
        // Calculate earnings (e.g., fixed amount per referral or percentage)
        // For now, let's say $0.50 per referral
        setEarnings(list.length * 0.50);
      } else {
        setReferrals([]);
        setEarnings(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm ring-1 ring-gray-900/5 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Programa de Afiliados</h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-8">
          Convide amigos e ganhe dinheiro! Você recebe <span className="font-bold text-indigo-600">$0.50</span> por cada usuário que se cadastrar com seu link.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 font-mono text-sm truncate">
            {referralLink}
          </div>
          <Button onClick={copyToClipboard} className="shrink-0">
            {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Referências</p>
              <h3 className="text-2xl font-bold text-gray-900">{referrals.length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ganhos de Afiliado</p>
              <h3 className="text-2xl font-bold text-gray-900">${earnings.toFixed(2)}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Seus Indicados</h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Você ainda não indicou ninguém. Comece a compartilhar seu link!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((ref) => (
                  <tr key={ref.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ref.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
