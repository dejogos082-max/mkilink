import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Code2, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Database, 
  Lock, 
  MessageSquare, 
  CreditCard,
  ArrowRight,
  Terminal,
  Info,
  Copy,
  Check,
  ChevronRight,
  Menu as MenuIcon,
  X
} from "lucide-react";

const endpoints = [
  {
    group: "Geral",
    items: [
      {
        method: "GET",
        path: "/api/ip",
        description: "Retorna o endereço IP público do cliente.",
        auth: "Público",
        icon: Globe,
        params: [],
        response: { ip: "123.45.67.89" }
      },
      {
        method: "GET",
        path: "/api/geo",
        description: "Retorna informações de geolocalização baseadas no IP do cliente.",
        auth: "Público",
        icon: Globe,
        params: [],
        response: { country: "Brasil", countryCode: "BR", city: "São Paulo" }
      }
    ]
  },
  {
    group: "Links & Arquivos",
    items: [
      {
        method: "POST",
        path: "/api/upload-url",
        description: "Gera uma URL pré-assinada para upload de arquivos no Cloudflare R2.",
        auth: "Usuário Autenticado",
        icon: Zap,
        params: [
          { name: "filename", type: "string", required: true },
          { name: "contentType", type: "string", required: true }
        ],
        response: { uploadUrl: "https://...", publicUrl: "https://..." }
      },
      {
        method: "GET",
        path: "/api/adsterra/smart-link",
        description: "Retorna um link inteligente ativo da Adsterra para monetização.",
        auth: "Público",
        icon: Zap,
        params: [],
        response: { url: "https://adsterra.com/..." }
      }
    ]
  },
  {
    group: "Suporte & IA",
    items: [
      {
        method: "POST",
        path: "/api/support/chat",
        description: "Endpoint do chat de suporte com busca na Base de Conhecimento e escalação para IA.",
        auth: "Usuário Autenticado",
        icon: MessageSquare,
        params: [
          { name: "userId", type: "string", required: true },
          { name: "message", type: "string", required: true },
          { name: "history", type: "array", required: false }
        ],
        response: { text: "Resposta da IA...", source: "Gemini", category: "LINKS" }
      },
      {
        method: "POST",
        path: "/api/support/notify-admins",
        description: "Notifica administradores sobre uma nova solicitação de suporte humano.",
        auth: "Usuário Autenticado",
        icon: MessageSquare,
        params: [
          { name: "userEmail", type: "string", required: true },
          { name: "problemDescription", type: "string", required: true },
          { name: "userId", type: "string", required: true }
        ],
        response: { success: true, message: "Admins notified" }
      }
    ]
  },
  {
    group: "Segurança & Autenticação",
    items: [
      {
        method: "POST",
        path: "/api/verify-hcaptcha",
        description: "Verifica o token do hCaptcha para proteção contra bots.",
        auth: "Público",
        icon: ShieldCheck,
        params: [
          { name: "token", type: "string", required: true }
        ],
        response: { success: true }
      },
      {
        method: "POST",
        path: "/api/log-login",
        description: "Registra o histórico de login do usuário, incluindo IP e User Agent.",
        auth: "Usuário Autenticado",
        icon: Database,
        params: [
          { name: "userId", type: "string", required: true },
          { name: "userAgent", type: "string", required: false },
          { name: "email", type: "string", required: false }
        ],
        response: { success: true }
      }
    ]
  }
];

export default function Documentation() {
  const [activeGroup, setActiveGroup] = useState(endpoints[0].group);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const generateCode = (item: any) => {
    const body = item.params.length > 0 
      ? `,\n  body: JSON.stringify({\n${item.params.map((p: any) => `    ${p.name}: "..."`).join(",\n")}\n  })`
      : "";

    return `fetch("${item.path}", {
  method: "${item.method}",
  headers: {
    "Content-Type": "application/json"
  }${body}
})
.then(res => res.json())
.then(data => console.log(data));`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-gray-900">API Docs</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`fixed lg:sticky top-0 lg:top-16 h-[calc(100vh-4rem)] w-72 bg-white border-r border-gray-200 z-30 overflow-y-auto transition-all ${
              isSidebarOpen ? 'left-0' : '-left-full lg:left-0'
            }`}
          >
            <div className="p-6 space-y-8">
              <div className="hidden lg:flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">API Docs</span>
              </div>

              <nav className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-3">Endpoints</p>
                {endpoints.map((group) => (
                  <button
                    key={group.group}
                    onClick={() => {
                      setActiveGroup(group.group);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeGroup === group.group
                        ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span>{group.group}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeGroup === group.group ? "rotate-90" : ""}`} />
                  </button>
                ))}
              </nav>

              <div className="pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-3">Links Úteis</p>
                <div className="space-y-1">
                  <a href="/support" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>Suporte Técnico</span>
                  </a>
                  <a href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Painel Admin</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto w-full">
        <div className="space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              {activeGroup}
            </h1>
            <p className="text-gray-500 text-lg">
              Endpoints relacionados a {activeGroup.toLowerCase()} no sistema MKI Links PRO.
            </p>
          </header>

          {/* Endpoints */}
          <div className="space-y-16">
            {endpoints.find(g => g.group === activeGroup)?.items.map((item, idx) => (
              <motion.section
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Endpoint Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      item.method === 'GET' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {item.method}
                    </span>
                    <code className="text-sm font-mono font-bold text-gray-800">
                      {item.path}
                    </code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                      <Lock className="w-3 h-3" />
                      {item.auth}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(item.path)}
                      className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-indigo-600"
                    >
                      {copiedPath === item.path ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-6 lg:p-8 grid lg:grid-cols-2 gap-8">
                  {/* Documentation */}
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Descrição</h3>
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    </div>

                    {item.params.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Parâmetros (Body)</h3>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 font-bold text-gray-700">Nome</th>
                                <th className="px-4 py-3 font-bold text-gray-700">Tipo</th>
                                <th className="px-4 py-3 font-bold text-gray-700">Obrigatório</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {item.params.map((p: any) => (
                                <tr key={p.name}>
                                  <td className="px-4 py-3 font-mono text-indigo-600">{p.name}</td>
                                  <td className="px-4 py-3 text-gray-500">{p.type}</td>
                                  <td className="px-4 py-3">
                                    {p.required ? (
                                      <span className="text-red-500 font-bold">Sim</span>
                                    ) : (
                                      <span className="text-gray-400">Não</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Exemplo de Resposta</h3>
                      <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                        <pre className="text-xs font-mono text-emerald-400">
                          {JSON.stringify(item.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Code Example */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Exemplo de Implementação</h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JavaScript / Fetch</span>
                    </div>
                    <div className="bg-gray-900 rounded-2xl p-6 shadow-inner relative group">
                      <pre className="text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto">
                        {generateCode(item)}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(generateCode(item))}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Certifique-se de estar autenticado para acessar este endpoint. Para chamadas externas, inclua os cookies de sessão ou o token de autorização necessário.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
