import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue, set } from "firebase/database";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { isNativeAppMode } from "../utils/nativeMode";
import {
  Save,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from "lucide-react";

export default function Profile() {
  const { currentUser, logout } = useAuth()!;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    document: "", // CPF/CNPJ
    isPEP: false,
    phone: "",
    secondaryEmail: "",
    allowDataCollection: false,
    allowPromotionalEmails: false,
  });

  useEffect(() => {
    if (!currentUser) return;

    const profileRef = ref(db, `users/${currentUser.uid}/profile`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFormData({
          fullName: data.fullName || "",
          birthDate: data.birthDate || "",
          document: data.document || "",
          isPEP: data.isPEP || false,
          phone: data.phone || "",
          secondaryEmail: data.secondaryEmail || "",
          allowDataCollection: data.allowDataCollection || false,
          allowPromotionalEmails: data.allowPromotionalEmails || false,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    setMessage(null);

    try {
      // Basic validation
      if (!formData.fullName.trim())
        throw new Error("O nome completo é obrigatório.");
      if (!formData.document.trim())
        throw new Error("O CPF/CNPJ é obrigatório.");
      if (
        formData.secondaryEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondaryEmail)
      ) {
        throw new Error("O email secundário é inválido.");
      }

      const profileRef = ref(db, `users/${currentUser.uid}/profile`);
      await set(profileRef, {
        ...formData,
        updatedAt: Date.now(),
      });

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Erro ao salvar o perfil.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          Meu Perfil
        </motion.h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Gerencie suas informações pessoais e preferências de privacidade.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl"
      >
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {message && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <User className="h-5 w-5 text-indigo-500" />
              Informações Pessoais
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Nome Completo"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <Input
                  label="Data de Nascimento"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Input
                  label="CPF/CNPJ"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <Input
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <Input
                  label="Email Secundário"
                  name="secondaryEmail"
                  type="email"
                  value={formData.secondaryEmail}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Privacidade e Conformidade
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    name="isPEP"
                    checked={formData.isPEP}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Sou uma Pessoa Politicamente Exposta (PEP)
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Marque esta opção se você ou um familiar próximo ocupa ou
                    ocupou cargo público relevante.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    name="allowDataCollection"
                    checked={formData.allowDataCollection}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Permitir coleta de dados
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Concordo com a coleta e processamento dos meus dados para
                    melhorar a experiência na plataforma.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    name="allowPromotionalEmails"
                    checked={formData.allowPromotionalEmails}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Receber emails promocionais
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Aceito receber novidades, ofertas e comunicações de
                    marketing.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className={`pt-4 flex ${isNativeAppMode() ? 'justify-between' : 'justify-end'} items-center`}>
            {isNativeAppMode() && (
              <Button type="button" variant="outline" onClick={logout} className="text-red-600 hover:bg-red-50 border-red-200">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            )}
            <Button type="submit" disabled={saving} className="min-w-[150px]">
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar Perfil</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
