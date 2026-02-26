import React from "react";
import { motion } from "motion/react";
import { 
  User, 
  Palette, 
  Shield, 
  Moon, 
  Sun, 
  Sparkles, 
  Cpu,
  ChevronRight,
  LogOut
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Button";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { currentUser, logout } = useAuth()!;

  const sections = [
    {
      id: "account",
      title: "Configurações de Conta",
      icon: User,
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">E-mail</p>
              <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
            </div>
            <Button variant="ghost" size="sm">Alterar</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Senha</p>
              <p className="text-sm font-medium text-gray-900">••••••••••••</p>
            </div>
            <Button variant="ghost" size="sm">Alterar</Button>
          </div>
          <Button 
            variant="danger" 
            className="w-full justify-start" 
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      )
    },
    {
      id: "appearance",
      title: "Configurações de Aparência",
      icon: Palette,
      color: "text-purple-500",
      bg: "bg-purple-50",
      content: (
        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {settings.theme === "light" ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Tema Escuro</p>
                <p className="text-xs text-gray-500">Alterne entre modo claro e escuro</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ theme: settings.theme === "light" ? "dark" : "light" })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.theme === "dark" ? "bg-indigo-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.theme === "dark" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Blur Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Efeito de Blur</p>
                <p className="text-xs text-gray-500">Ativar transparência e desfoque</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ blurEnabled: !settings.blurEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.blurEnabled ? "bg-indigo-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.blurEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Hardware Acceleration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Cpu className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Aceleração de Hardware</p>
                <p className="text-xs text-gray-500">Melhora o desempenho visual</p>
              </div>
            </div>
            <button 
              onClick={() => updateSettings({ hardwareAcceleration: !settings.hardwareAcceleration })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.hardwareAcceleration ? "bg-indigo-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.hardwareAcceleration ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: "privacy",
      title: "Configurações de Privacidade",
      icon: Shield,
      color: "text-orange-500",
      bg: "bg-orange-50",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-900">Visibilidade do Perfil</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-600 font-bold">Público</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-900">Dados e Telemetria</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-[10px] text-gray-400 text-center px-4">
            Suas informações são protegidas e nunca compartilhadas com terceiros sem seu consentimento.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold tracking-tight text-gray-900"
        >
          Configurações
        </motion.h1>
        <p className="text-gray-500">Personalize sua experiência no MKI Links PRO</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-50 flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${section.bg} ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {section.title}
              </h2>
            </div>
            <div className="p-6 flex-grow">
              {section.content}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
