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
  ShieldOff,
  Settings,
  Bell,
  Send
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
  lastIp?: string;
  loginHistory?: Record<string, any>;
}

interface BannedIP {
  id: string;
  ip: string;
  reason: string;
  bannedAt: number;
  bannedBy: string;
}

interface RoleSettings {
  maxShortLinks: number;
  maxAdvancedLinks: number;
  maxCampaigns: number;
  maxBioPages: number;
  allowAutoQrCode: boolean;
  allowMonetization: boolean;
  allowedPages: string[];
}

export default function Admin() {
  const { currentUser, isAdmin } = useAuth() || { currentUser: null, isAdmin: false };
  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'ips' | 'settings' | 'notifications' | 'roles'>('users');
  
  // Data States
  const [users, setUsers] = useState<UserData[]>([]);
  const [adminCodes, setAdminCodes] = useState<AdminCode[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIP[]>([]);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [roleSettings, setRoleSettings] = useState<Record<string, RoleSettings>>({});
  const [selectedRole, setSelectedRole] = useState<string>('UserFree');
  
  // Notification States
  const [notifTarget, setNotifTarget] = useState<'all' | 'specific'>('all');
  const [notifEmail, setNotifEmail] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [notifActionType, setNotifActionType] = useState<'none' | 'link' | 'route'>('none');
  const [notifActionPayload, setNotifActionPayload] = useState("");
  const [notifScheduledDate, setNotifScheduledDate] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [scheduledNotifs, setScheduledNotifs] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  
  // Modal States
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  
  // Invite Admin State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'AdminUser' | 'UserPremium' | 'UserEnterprise'>('AdminUser');

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
    const codesRef = ref(db, "AdminCode");
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

    // Fetch Settings
    const settingsRef = ref(db, "settings");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.storeEnabled !== undefined) {
          setStoreEnabled(data.storeEnabled);
        }
        if (data.roles) {
          setRoleSettings(data.roles);
        } else {
          // Initialize default roles if not present
          const defaultRoles = {
            UserFree: {
              maxShortLinks: 10,
              maxAdvancedLinks: 0,
              maxCampaigns: 0,
              maxBioPages: 1,
              allowAutoQrCode: false,
              allowMonetization: false,
              allowedPages: ['/dashboard', '/links', '/profile', '/menu']
            },
            UserPremium: {
              maxShortLinks: 50,
              maxAdvancedLinks: 10,
              maxCampaigns: 5,
              maxBioPages: 3,
              allowAutoQrCode: true,
              allowMonetization: false,
              allowedPages: ['/dashboard', '/links', '/profile', '/campaigns', '/stats', '/menu', '/manage-plan']
            },
            UserEnterprise: {
              maxShortLinks: 9999,
              maxAdvancedLinks: 9999,
              maxCampaigns: 9999,
              maxBioPages: 9999,
              allowAutoQrCode: true,
              allowMonetization: true,
              allowedPages: ['/dashboard', '/links', '/profile', '/campaigns', '/stats', '/monetization', '/custom-domains', '/affiliates', '/menu', '/manage-plan']
            }
          };
          setRoleSettings(defaultRoles);
        }
      }
    });

    // Fetch Scheduled Notifications
    const scheduledRef = ref(db, "scheduled_notifications");
    const unsubScheduled = onValue(scheduledRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        })).sort((a, b) => a.scheduledAt - b.scheduledAt);
        setScheduledNotifs(list);
      } else {
        setScheduledNotifs([]);
      }
    });

    return () => {
      unsubUsers();
      unsubCodes();
      unsubIps();
      unsubSettings();
      unsubScheduled();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
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
    const isSelf = userId === currentUser?.uid;
    if (isSelf) {
      if (!confirm("ATENÇÃO: Você está prestes a remover seus próprios privilégios de administrador. Você perderá acesso ao painel imediatamente. Deseja continuar?")) {
        return;
      }
    }

    try {
      await remove(ref(db, `users/${userId}/role`));
      showToast("Privilégios de administrador removidos");
    } catch (error) {
      showToast("Erro ao remover privilégios", "error");
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm("Tem certeza que deseja tornar este usuário um Administrador?")) return;
    try {
      await update(ref(db, `users/${userId}`), { role: 'AdminUser' });
      showToast("Usuário promovido a Administrador com sucesso!");
    } catch (error) {
      showToast("Erro ao promover usuário", "error");
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      // 1. Generate unique code
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // 2. Save invite to DB
      // We use a generic 'invites' path now, but keep 'admin_invites' for backward compatibility if needed or just migrate.
      // For simplicity and to support roles, let's use 'invites'.
      // But wait, AcceptInvite reads from 'admin_invites'. I should update AcceptInvite first or simultaneously.
      // Let's use 'admin_invites' for now but add the role field, and update AcceptInvite to read it.
      // Actually, 'admin_invites' name is misleading now. Let's use 'invites' and update AcceptInvite.
      await set(ref(db, `invites/${inviteCode}`), {
        email: inviteEmail,
        role: inviteRole,
        createdBy: currentUser?.uid,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });

      // 3. Find user by email to send notification
      const targetUser = users.find(u => u.email === inviteEmail);
      
      if (targetUser) {
        // Send notification with link
        const roleName = inviteRole === 'AdminUser' ? 'Administrador' : 
                         inviteRole === 'UserPremium' ? 'Workspace Premium' : 'Workspace Enterprise';
        
        const notification = {
          title: `Convite para ${roleName}`,
          message: `Você foi convidado para o plano ${roleName}. Clique para aceitar.`,
          type: "success",
          actionType: "route",
          actionPayload: `/accept-invite/${inviteCode}`,
          createdAt: Date.now(),
          read: false
        };
        
        await push(ref(db, `notifications/${targetUser.id}`), notification);
        showToast(`Convite enviado para ${inviteEmail}`);
      } else {
        // If user not found, we still created the invite code, but can't send notification internally.
        // Maybe show the link to copy?
        showToast("Convite criado, mas usuário não encontrado para notificação automática.", "warning");
      }
      
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setSearchQuery(""); // Clear search query to restore full user list
    } catch (error) {
      console.error(error);
      showToast("Erro ao enviar convite", "error");
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
      const newCodeRef = push(ref(db, "AdminCode"));
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

  const handleDeleteCode = (codeId: string) => {
    setCodeToDelete(codeId);
  };

  const confirmDeleteCode = async () => {
    if (!codeToDelete) return;
    try {
      await remove(ref(db, `AdminCode/${codeToDelete}`));
      showToast("Código excluído");
      setCodeToDelete(null);
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

  const handleToggleStore = async () => {
    try {
      await update(ref(db, "settings"), {
        storeEnabled: !storeEnabled
      });
      showToast(`Loja ${!storeEnabled ? 'ativada' : 'desativada'} com sucesso`);
    } catch (error) {
      showToast("Erro ao atualizar configurações", "error");
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm("Cancelar agendamento?")) return;
    try {
      await remove(ref(db, `scheduled_notifications/${id}`));
      showToast("Agendamento cancelado");
    } catch (error) {
      showToast("Erro ao cancelar", "error");
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      showToast("Preencha título e mensagem", "error");
      return;
    }
    
    if (notifActionType !== 'none' && !notifActionPayload) {
      showToast("Preencha o conteúdo da ação (URL ou Rota)", "error");
      return;
    }

    setIsSendingNotif(true);
    try {
      const notificationBase = {
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        actionType: notifActionType,
        actionPayload: notifActionPayload,
        createdAt: Date.now(),
        read: false
      };

      // Check if scheduled
      if (notifScheduledDate) {
        const scheduledTime = new Date(notifScheduledDate).getTime();
        if (scheduledTime <= Date.now()) {
          showToast("Data de agendamento deve ser futura", "error");
          setIsSendingNotif(false);
          return;
        }

        const scheduledNotif = {
          ...notificationBase,
          scheduledAt: scheduledTime,
          target: notifTarget,
          targetEmail: notifTarget === 'specific' ? notifEmail : null,
          status: 'pending'
        };

        await push(ref(db, "scheduled_notifications"), scheduledNotif);
        showToast("Notificação agendada com sucesso!");
      } else {
        // Send immediately
        if (notifTarget === 'all') {
          const updates: Record<string, any> = {};
          users.forEach(user => {
            const newNotifKey = push(ref(db, `notifications/${user.id}`)).key;
            if (newNotifKey) {
              updates[`notifications/${user.id}/${newNotifKey}`] = notificationBase;
            }
          });
          await update(ref(db), updates);
          showToast(`Notificação enviada para ${users.length} usuários`);
        } else {
          const targetUser = users.find(u => u.email === notifEmail);
          if (!targetUser) {
            showToast("Usuário não encontrado com este email", "error");
            setIsSendingNotif(false);
            return;
          }
          await push(ref(db, `notifications/${targetUser.id}`), notificationBase);
          showToast(`Notificação enviada para ${notifEmail}`);
        }
      }

      // Reset form
      setNotifTitle("");
      setNotifMessage("");
      setNotifEmail("");
      setNotifActionType('none');
      setNotifActionPayload("");
      setNotifScheduledDate("");
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar notificação", "error");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleSaveRoleSettings = async () => {
    try {
      await update(ref(db, "settings/roles"), roleSettings);
      showToast("Configurações de planos salvas com sucesso!");
    } catch (error) {
      showToast("Erro ao salvar configurações", "error");
    }
  };

  const updateRoleSetting = (field: keyof RoleSettings, value: any) => {
    setRoleSettings(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [field]: value
      }
    }));
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
              toast.type === 'success' ? 'bg-emerald-500' : 
              toast.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
             toast.type === 'warning' ? <ShieldAlert className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
      <div className="flex bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários</span>
        </button>
        <button
          onClick={() => setActiveTab('codes')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'codes' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Códigos</span>
        </button>
        <button
          onClick={() => setActiveTab('ips')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'ips' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>IPs</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Avisos</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'roles' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Planos</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Config</span>
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
              <div className="flex gap-2">
                <Button onClick={() => { setInviteRole('UserPremium'); setIsInviteModalOpen(true); }} size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Premium
                </Button>
                <Button onClick={() => { setInviteRole('UserEnterprise'); setIsInviteModalOpen(true); }} size="sm" className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Enterprise
                </Button>
                <Button onClick={() => { setInviteRole('AdminUser'); setIsInviteModalOpen(true); }} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Admin
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email / ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Recente</th>
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
                        <div className="text-sm text-gray-600 font-mono">{user.lastIp || 'Desconhecido'}</div>
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
                          {user.role === 'AdminUser' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveAdmin(user.id)} 
                              className="text-orange-600 hover:bg-orange-50" 
                              title={user.id === currentUser?.uid ? "Remover meus privilégios" : "Remover Admin"}
                            >
                              <ShieldOff className="w-4 h-4" />
                            </Button>
                          )}
                          {user.role !== 'AdminUser' && (
                            <Button variant="ghost" size="sm" onClick={() => handlePromoteToAdmin(user.id)} className="text-indigo-600 hover:bg-indigo-50" title="Promover a Admin">
                              <ShieldAlert className="w-4 h-4" />
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

        {activeTab === 'notifications' && (
          <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Enviar Notificação / Aviso</h2>
            
            <form onSubmit={handleSendNotification} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destinatário</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="target" 
                        checked={notifTarget === 'all'} 
                        onChange={() => setNotifTarget('all')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Todos os Usuários</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="target" 
                        checked={notifTarget === 'specific'} 
                        onChange={() => setNotifTarget('specific')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Usuário Específico</span>
                    </label>
                  </div>
                </div>

                {notifTarget === 'specific' && (
                  <Input
                    label="Email do Usuário"
                    type="email"
                    value={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.value)}
                    placeholder="usuario@exemplo.com"
                    required
                  />
                )}

                <Input
                  label="Título"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ex: Manutenção Programada"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Mensagem</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={4}
                    className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                    placeholder="Digite sua mensagem aqui..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Aviso</label>
                  <div className="flex gap-2">
                    {(['info', 'warning', 'success', 'error'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotifType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                          notifType === type 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ação (Opcional)</label>
                    <select
                      value={notifActionType}
                      onChange={(e) => setNotifActionType(e.target.value as any)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="none">Nenhuma</option>
                      <option value="link">Link Externo</option>
                      <option value="route">Redirecionamento Interno</option>
                    </select>
                  </div>
                  
                  {notifActionType !== 'none' && (
                    <div>
                      <Input
                        label={notifActionType === 'link' ? "URL (https://...)" : "Rota (/caminho)"}
                        value={notifActionPayload}
                        onChange={(e) => setNotifActionPayload(e.target.value)}
                        placeholder={notifActionType === 'link' ? "https://google.com" : "/menu"}
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agendamento (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={notifScheduledDate}
                    onChange={(e) => setNotifScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe em branco para enviar imediatamente.</p>
                </div>
              </div>

              <Button type="submit" isLoading={isSendingNotif} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {notifScheduledDate ? "Agendar Notificação" : "Enviar Notificação"}
              </Button>
            </form>

            {scheduledNotifs.length > 0 && (
              <div className="mt-12 border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações Agendadas</h3>
                <div className="space-y-3">
                  {scheduledNotifs.map((notif) => (
                    <div key={notif.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            notif.type === 'error' ? 'bg-red-100 text-red-700' :
                            notif.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                            notif.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-indigo-100 text-indigo-700'
                          }`}>
                            {notif.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            Para: {notif.target === 'all' ? 'Todos' : notif.targetEmail}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{notif.message}</p>
                        <p className="text-xs text-indigo-600 mt-2 font-medium">
                          Agendado para: {new Date(notif.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteScheduled(notif.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Cancelar agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {activeTab === 'settings' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Configurações Gerais</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Loja Virtual</h3>
                  <p className="text-sm text-gray-500 mt-1">Ativar ou desativar a exibição da loja no menu principal.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={storeEnabled}
                    onChange={handleToggleStore}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Configuração de Planos</h2>
              <Button onClick={handleSaveRoleSettings} size="sm" className="bg-indigo-600 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Plano para Editar</label>
              <div className="flex gap-2">
                {['UserFree', 'UserPremium', 'UserEnterprise'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedRole === role
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {role === 'UserFree' ? 'Gratuito' : role === 'UserPremium' ? 'Premium' : 'Enterprise'}
                  </button>
                ))}
              </div>
            </div>

            {roleSettings[selectedRole] && (
              <div className="space-y-8">
                {/* Limits Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Limites do Plano</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input
                      label="Máx. Links Curtos"
                      type="number"
                      value={roleSettings[selectedRole].maxShortLinks}
                      onChange={(e) => updateRoleSetting('maxShortLinks', Number(e.target.value))}
                    />
                    <Input
                      label="Máx. Links Avançados"
                      type="number"
                      value={roleSettings[selectedRole].maxAdvancedLinks}
                      onChange={(e) => updateRoleSetting('maxAdvancedLinks', Number(e.target.value))}
                    />
                    <Input
                      label="Máx. Campanhas"
                      type="number"
                      value={roleSettings[selectedRole].maxCampaigns}
                      onChange={(e) => updateRoleSetting('maxCampaigns', Number(e.target.value))}
                    />
                    <Input
                      label="Máx. Páginas Bio"
                      type="number"
                      value={roleSettings[selectedRole].maxBioPages}
                      onChange={(e) => updateRoleSetting('maxBioPages', Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Features Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Recursos Permitidos</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={roleSettings[selectedRole].allowAutoQrCode}
                        onChange={(e) => updateRoleSetting('allowAutoQrCode', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900">QR Code Automático</span>
                        <span className="block text-xs text-gray-500">Permitir geração automática de QR Codes para links</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={roleSettings[selectedRole].allowMonetization}
                        onChange={(e) => updateRoleSetting('allowMonetization', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900">Monetização</span>
                        <span className="block text-xs text-gray-500">Permitir participação no programa de monetização</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Page Access Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Acesso às Páginas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { path: '/dashboard', label: 'Dashboard' },
                      { path: '/menu', label: 'Menu' },
                      { path: '/links', label: 'Gerenciador de Links' },
                      { path: '/simple-links', label: 'Links Simples' },
                      { path: '/stats', label: 'Estatísticas' },
                      { path: '/monetization', label: 'Monetização' },
                      { path: '/link-bio', label: 'Link na Bio' },
                      { path: '/settings', label: 'Configurações' },
                      { path: '/profile', label: 'Perfil' },
                      { path: '/store', label: 'Loja' },
                      { path: '/campaigns', label: 'Campanhas' },
                      { path: '/custom-domains', label: 'Domínios Personalizados' },
                      { path: '/affiliates', label: 'Afiliados' },
                    ].map((page) => (
                      <label key={page.path} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={roleSettings[selectedRole].allowedPages?.includes(page.path)}
                          onChange={(e) => {
                            const currentPages = roleSettings[selectedRole].allowedPages || [];
                            let newPages;
                            if (e.target.checked) {
                              newPages = [...currentPages, page.path];
                            } else {
                              newPages = currentPages.filter(p => p !== page.path);
                            }
                            updateRoleSetting('allowedPages', newPages);
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{page.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
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
                <h3 className="text-lg font-bold text-gray-900">
                  Convidar {inviteRole === 'AdminUser' ? 'Administrador' : inviteRole === 'UserPremium' ? 'Premium' : 'Enterprise'}
                </h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleInviteUser} className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  O usuário receberá uma notificação com um link para aceitar o convite e se tornar um {inviteRole === 'AdminUser' ? 'administrador' : inviteRole === 'UserPremium' ? 'usuário Premium' : 'usuário Enterprise'}.
                </p>
                <Input
                  label="Email do Usuário"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                />
                
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    Enviar Convite
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Delete Code Modal */}
      <AnimatePresence>
        {codeToDelete && (
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Código</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir este código permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setCodeToDelete(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" 
                  onClick={confirmDeleteCode}
                >
                  Excluir
                </Button>
              </div>
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
