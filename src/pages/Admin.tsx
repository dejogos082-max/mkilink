import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue, set, remove, push, update } from "firebase/database";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { 
  ShieldAlert, 
  Users, 
  Key, 
  Ban, 
  Trash2, 
  Plus,
  Search,
  CheckCircle2,
  X,
  ShieldOff
} from "lucide-react";
import { Navigate } from "react-router-dom";

interface AdminCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: number;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  status?: 'active' | 'suspended' | 'banned';
  loginHistory?: Record<string, any>;
}

interface BannedIP {
  id: string;
  ip: string;
  reason: string;
  bannedAt: number;
  bannedBy: string;
}

export default function Admin() {
  const { currentUser, isAdmin } = useAuth() || { currentUser: null, isAdmin: false };
  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'ips'>('users');
  
  // Data States
  const [users, setUsers] = useState<UserData[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIP[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Modal States
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [ipReason, setIpReason] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch Users
    const usersRef = ref(db, "users");
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
    });

    // Fetch Admin Codes
    const codesRef = ref(db, "admin_codes");
    const unsubCodes = onValue(codesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const codeList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setAdminCodes(codeList);
      } else {
        setAdminCodes([]);
      }
    });

    // Fetch Banned IPs
    const ipsRef = ref(db, "banned_ips");
    const unsubIps = onValue(ipsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const ipList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }));
        setBannedIps(ipList);
      } else {
        setBannedIps([]);
      }
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubCodes();
      unsubIps();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // User Actions
  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      await set(ref(db, `users/${userId}/status`), status);
      showToast(`Status do usuário atualizado para ${status}`);
    } catch (error) {
      showToast("Erro ao atualizar status", "error");
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await remove(ref(db, `users/${userId}/role`));
      showToast("Privilégios de administrador removidos");
    } catch (error) {
      showToast("Erro ao remover privilégios", "error");
    }
  };

  // Code Actions
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || newCode.length < 6) {
      showToast("O código deve ter pelo menos 6 caracteres", "error");
      return;
    }

    try {
      const newCodeRef = push(ref(db, "admin_codes"));
      await set(newCodeRef, {
        code: newCode,
        createdBy: currentUser?.uid,
        createdAt: Date.now()
      });
      setIsCodeModalOpen(false);
      setNewCode("");
      showToast("Código criado com sucesso");
    } catch (error) {
      showToast("Erro ao criar código", "error");
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm("Tem certeza que deseja excluir este código?")) return;
    try {
      await remove(ref(db, `admin_codes/${codeId}`));
      showToast("Código excluído");
    } catch (error) {
      showToast("Erro ao excluir código", "error");
    }
  };

  // IP Actions
  const handleBanIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;

    try {
      const newIpRef = push(ref(db, "banned_ips"));
      await set(newIpRef, {
        ip: newIp,
        reason: ipReason,
        bannedBy: currentUser?.uid,
        bannedAt: Date.now()
      });
      setIsIpModalOpen(false);
      setNewIp("");
      setIpReason("");
      showToast("IP banido com sucesso");
    } catch (error) {
      showToast("Erro ao banir IP", "error");
    }
  };

  const handleUnbanIp = async (ipId: string) => {
    if (!confirm("Tem certeza que deseja desbanir este IP?")) return;
    try {
      await remove(ref(db, `banned_ips/${ipId}`));
      showToast("IP desbanido");
    } catch (error) {
      showToast("Erro ao desbanir IP", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.includes(searchQuery)
  );

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span>Administração</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie usuários, acessos e segurança da plataforma.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários</span>
        </button>
        <button
          onClick={() => setActiveTab('codes')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'codes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Códigos Admin</span>
        </button>
        <button
          onClick={() => setActiveTab('ips')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'ips' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>IPs Banidos</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por email ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.email || 'Sem Email'}</div>
                        <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'banned' ? 'bg-red-100 text-red-800' :
                          user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.status === 'banned' ? 'Banido' : user.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'AdminUser' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'AdminUser' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'AdminUser' && user.id !== currentUser?.uid && (
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveAdmin(user.id)} className="text-orange-600 hover:bg-orange-50" title="Remover Admin">
                              <ShieldOff className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status !== 'banned' && user.id !== currentUser?.uid && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateUserStatus(user.id, 'banned')} className="text-red-600 hover:bg-red-50" title="Banir">
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status !== 'suspended' && user.status !== 'banned' && user.id !== currentUser?.uid && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateUserStatus(user.id, 'suspended')} className="text-yellow-600 hover:bg-yellow-50" title="Suspender">
                              <ShieldAlert className="w-4 h-4" />
                            </Button>
                          )}
                          {user.status !== 'active' && user.status !== undefined && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateUserStatus(user.id, 'active')} className="text-green-600 hover:bg-green-50" title="Ativar">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'codes' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Códigos de Acesso</h2>
              <Button onClick={() => setIsCodeModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Código
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adminCodes.map(code => (
                    <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600">{code.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(code.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCode(code.id)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {adminCodes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhum código criado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ips' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">IPs Banidos</h2>
              <Button onClick={() => setIsIpModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Banir IP
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Endereço IP</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bannedIps.map(ip => (
                    <tr key={ip.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-red-600">{ip.ip}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ip.reason || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(ip.bannedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleUnbanIp(ip.id)} className="text-green-600 hover:bg-green-50" title="Desbanir">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {bannedIps.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum IP banido.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      <AnimatePresence>
        {isCodeModalOpen && (
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
                <h3 className="text-lg font-bold text-gray-900">Novo Código Admin</h3>
                <button onClick={() => setIsCodeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCode} className="p-6 space-y-4">
                <Input
                  label="Código de Acesso"
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ex: 123456"
                  minLength={6}
                />
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsCodeModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Criar Código
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban IP Modal */}
      <AnimatePresence>
        {isIpModalOpen && (
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
                <h3 className="text-lg font-bold text-gray-900">Banir IP</h3>
                <button onClick={() => setIsIpModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleBanIp} className="p-6 space-y-4">
                <Input
                  label="Endereço IP"
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Ex: 192.168.1.1"
                />
                <Input
                  label="Motivo (Opcional)"
                  type="text"
                  value={ipReason}
                  onChange={(e) => setIpReason(e.target.value)}
                  placeholder="Ex: Abuso do sistema"
                />
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsIpModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0">
                    Banir IP
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
