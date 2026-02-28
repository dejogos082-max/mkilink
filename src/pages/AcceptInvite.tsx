import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, get, remove, update } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const { inviteCode } = useParams();
  const { currentUser } = useAuth()!;
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Verificando convite...");

  useEffect(() => {
    const verifyInvite = async () => {
      if (!inviteCode || !currentUser) {
        setStatus('error');
        setMessage("Convite inválido ou usuário não autenticado.");
        return;
      }

      try {
        const inviteRef = ref(db, `admin_invites/${inviteCode}`);
        const snapshot = await get(inviteRef);

        if (snapshot.exists()) {
          const inviteData = snapshot.val();
          
          // Optional: Check if invite is for this specific email
          if (inviteData.email && inviteData.email !== currentUser.email) {
             setStatus('error');
             setMessage("Este convite não é para sua conta.");
             return;
          }

          // Grant Admin Role
          await update(ref(db, `users/${currentUser.uid}`), { role: 'AdminUser' });
          
          // Delete Invite
          await remove(inviteRef);

          setStatus('success');
          setMessage("Parabéns! Você agora é um Administrador.");
          
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        } else {
          setStatus('error');
          setMessage("Convite inválido ou expirado.");
        }
      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage("Erro ao processar convite.");
      }
    };

    verifyInvite();
  }, [inviteCode, currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">Processando...</h2>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Sucesso!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-400 mt-2">Redirecionando para o painel...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Erro</h2>
            <p className="text-gray-600">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
