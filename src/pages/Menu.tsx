import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserCircle, 
  BarChart3, 
  DollarSign, 
  Settings, 
  Link as LinkIcon,
  ArrowRight,
  ShieldAlert,
  ShoppingBag,
  CreditCard,
  Folder,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

const menuItems = [
  {
    title: "Dashboard",
    description: "Visão geral da sua conta e atalhos rápidos.",
    icon: LayoutDashboard,
    path: "/",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    bgLight: "bg-indigo-50"
  },
  {
    title: "Links",
    description: "Gerencie, crie e edite todos os seus links curtos.",
    icon: LinkIcon,
    path: "/links",
    color: "bg-violet-500",
    textColor: "text-violet-500",
    bgLight: "bg-violet-50"
  },
  {
    title: "Link na Bio",
    description: "Crie uma página de destino bonita para suas redes sociais.",
    icon: UserCircle,
    path: "/link-bio",
    color: "bg-pink-500",
    textColor: "text-pink-500",
    bgLight: "bg-pink-50"
  },
  {
    title: "Campanhas",
    description: "Organize seus links em grupos.",
    icon: Folder,
    path: "/campaigns",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    bgLight: "bg-orange-50"
  },
  {
    title: "Estatísticas",
    description: "Análises detalhadas para todos os seus links e campanhas.",
    icon: BarChart3,
    path: "/stats",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgLight: "bg-blue-50"
  },
  {
    title: "Monetização",
    description: "Gerencie suas configurações de anúncios e ganhos.",
    icon: DollarSign,
    path: "/monetization",
    color: "bg-green-500",
    textColor: "text-green-500",
    bgLight: "bg-green-50"
  },
  {
    title: "Afiliados",
    description: "Ganhe dinheiro indicando amigos.",
    icon: Users,
    path: "/affiliates",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    bgLight: "bg-emerald-50"
  },
  {
    title: "Loja",
    description: "Compre temas, emblemas e funcionalidades extras.",
    icon: ShoppingBag,
    path: "/store",
    color: "bg-amber-500",
    textColor: "text-amber-500",
    bgLight: "bg-amber-50"
  },
  {
    title: "Planos",
    description: "Escolha o melhor plano para suas necessidades.",
    icon: CreditCard,
    path: "/plans",
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    bgLight: "bg-emerald-50"
  },
  {
    title: "Configurações",
    description: "Preferências da conta e configurações globais.",
    icon: Settings,
    path: "/settings",
    color: "bg-gray-500",
    textColor: "text-gray-500",
    bgLight: "bg-gray-50"
  }
];

export default function Menu() {
  const { isAdmin } = useAuth() || { isAdmin: false };
  const [storeEnabled, setStoreEnabled] = useState(true);

  useEffect(() => {
    const settingsRef = ref(db, "settings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.storeEnabled !== undefined) {
          setStoreEnabled(data.storeEnabled);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const displayedMenuItems = menuItems.filter(item => {
    if (item.path === "/store" && !storeEnabled) return false;
    return true;
  });

  if (isAdmin) {
    displayedMenuItems.push({
      title: "Administração",
      description: "Gerenciamento de usuários, IPs e códigos de acesso.",
      icon: ShieldAlert,
      path: "/admin",
      color: "bg-red-500",
      textColor: "text-red-500",
      bgLight: "bg-red-50"
    });
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          <span>Menu</span>
        </motion.h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          <span>Acesse todas as suas ferramentas e configurações em um só lugar.</span>
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedMenuItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={item.path}
              className="group relative flex flex-col h-full bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md hover:ring-indigo-500/20"
            >
              <div className={`h-12 w-12 rounded-xl ${item.bgLight} ${item.textColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                <span>{item.title}</span>
              </h3>
              
              <p className="text-sm text-gray-500 mb-6 flex-grow">
                <span>{item.description}</span>
              </p>
              
              <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-indigo-600 transition-colors mt-auto">
                <span>Abrir</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
