import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, get, remove, update } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";

export default function AcceptInvite() {
  const { inviteCode } = useParams();
  const { currentUser } = useAuth()!;
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'confirming' | 'processing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("Verificando convite...");
  const [inviteData, setInviteData] = useState<any>(null);
  const [roleName, setRoleName] = useState("");
  const [inviteRefPath, setInviteRefPath] = useState("");

  useEffect(() => {
    const verifyInvite = async () => {
      if (!inviteCode || !currentUser) {
        setStatus('error');
        setMessage("Convite inválido ou usuário não autenticado.");
        return;
      }

      try {
        // Try 'invites' first (new system)
        let path = `invites/${inviteCode}`;
        let inviteRef = ref(db, path);
        let snapshot = await get(inviteRef);
        let isLegacy = false;

        // Fallback to 'admin_invites' (legacy)
        if (!snapshot.exists()) {
            path = `admin_invites/${inviteCode}`;
            inviteRef = ref(db, path);
            snapshot = await get(inviteRef);
            isLegacy = true;
        }

        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Optional: Check if invite is for this specific email
          if (data.email && data.email !== currentUser.email) {
             setStatus('error');
             setMessage("Este convite não é para sua conta.");
             return;
          }

          // Determine Role Name for display
          const roleToAssign = isLegacy ? 'AdminUser' : (data.role || 'AdminUser');
          const name = roleToAssign === 'AdminUser' ? 'Administrador' : 
                       roleToAssign === 'UserPremium' ? 'Premium' : 'Enterprise';
          
          // Check expiration
          if (data.expiresAt && Date.now() > data.expiresAt) {
              setStatus('error');
              setMessage("Este convite expirou.");
              return;
          }
          
          setInviteData({ ...data, roleToAssign });
          setRoleName(name);
          setInviteRefPath(path);
          setStatus('confirming');
          setMessage(`Você foi convidado para se tornar um usuário ${name}.`);

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
  }, [inviteCode, currentUser]);

  const handleAccept = async () => {
    if (!inviteData || !currentUser || !inviteRefPath) return;

    setStatus('processing');
    setMessage("Atualizando seu perfil...");

    try {
      // Grant Role
      await update(ref(db, `users/${currentUser.uid}`), { role: inviteData.roleToAssign });
      
      // Delete Invite
      await remove(ref(db, inviteRefPath));

      setStatus('success');
      setMessage(`Parabéns! Você agora é um usuário ${roleName}.`);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage("Erro ao aceitar convite. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">Verificando...</h2>
            <p className="text-gray-500">{message}</p>
          </div>
        )}

        {status === 'confirming' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Aceitar Convite</h2>
              <p className="text-gray-600 mt-2">{message}</p>
              <p className="text-sm text-gray-500 mt-1">
                Ao aceitar, suas permissões serão atualizadas imediatamente.
              </p>
            </div>
            
            <div className="flex gap-3 w-full">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleAccept}
              >
                Aceitar Convite
              </Button>
            </div>
          </div>
        )}

        {status === 'processing' && (
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
