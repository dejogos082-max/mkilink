import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  HelpCircle, 
  User, 
  Link as LinkIcon, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Search,
  MessageSquare,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";

const categories = [
  {
    id: "account",
    title: "Conta",
    icon: User,
    color: "text-blue-500",
    bg: "bg-blue-50",
    articles: [
      {
        id: "create-account",
        title: "Criar conta",
        content: `
          <h3 class="font-bold text-lg mb-2">Como criar sua conta no MKI Links PRO</h3>
          <p class="mb-4">Siga estes passos simples para começar:</p>
          <ol class="list-decimal list-inside space-y-2 mb-4">
            <li>Acesse a página inicial e clique em "Começar" ou "Registrar".</li>
            <li>Preencha seu nome, email e escolha uma senha forte.</li>
            <li>Clique em "Criar Conta".</li>
            <li>Verifique seu email para confirmar o cadastro.</li>
          </ol>
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <p class="text-green-800 font-medium">✨ Dica rápida: Você também pode usar sua conta Google para entrar mais rápido!</p>
          </div>
        `
      },
      {
        id: "recover-password",
        title: "Recuperar senha",
        content: `
          <h3 class="font-bold text-lg mb-2">Esqueceu sua senha?</h3>
          <p class="mb-4">Não se preocupe, é fácil recuperar:</p>
          <ol class="list-decimal list-inside space-y-2 mb-4">
            <li>Na tela de login, clique em "Esqueceu a senha?".</li>
            <li>Digite seu email cadastrado.</li>
            <li>Verifique sua caixa de entrada (e spam) para o link de redefinição.</li>
            <li>Crie uma nova senha.</li>
          </ol>
        `
      }
    ]
  },
  {
    id: "links",
    title: "Encurtador de Links",
    icon: LinkIcon,
    color: "text-violet-500",
    bg: "bg-violet-50",
    articles: [
      {
        id: "create-link",
        title: "Como criar link curto",
        content: `
          <h3 class="font-bold text-lg mb-2">Criando seu primeiro link curto</h3>
          <p class="mb-4">Transforme URLs longas em links curtos e rastreáveis:</p>
          <div class="bg-gray-100 p-4 rounded-lg mb-4 font-mono text-sm">
            1. Faça login no seu painel<br/>
            2. Clique no botão "Criar Link" ou use o atalho rápido no topo<br/>
            3. Cole a URL original (ex: https://youtube.com/...)<br/>
            4. (Opcional) Personalize o final do link<br/>
            5. Clique em "Encurtar"
          </div>
          <p>Seu link estará pronto para uso imediatamente!</p>
        `
      },
      {
        id: "edit-link",
        title: "Como editar link",
        content: `
          <h3 class="font-bold text-lg mb-2">Editando um link existente</h3>
          <p class="mb-4">Você pode alterar o destino ou configurações a qualquer momento:</p>
          <ol class="list-decimal list-inside space-y-2 mb-4">
            <li>Vá para a página "Links".</li>
            <li>Encontre o link que deseja alterar.</li>
            <li>Clique no ícone de lápis (Editar).</li>
            <li>Faça suas alterações e salve.</li>
          </ol>
        `
      }
    ]
  },
  {
    id: "monetization",
    title: "Monetização",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-50",
    articles: [
      {
        id: "how-to-earn",
        title: "Como ganhar dinheiro",
        content: `
          <h3 class="font-bold text-lg mb-2">Monetizando seus links</h3>
          <p class="mb-4">Ganhe dinheiro cada vez que alguém clica em seus links:</p>
          <ul class="list-disc list-inside space-y-2 mb-4">
            <li>Ative a monetização nas configurações do link.</li>
            <li>Escolha o tipo de anúncio (Intersticial ou Banner).</li>
            <li>Compartilhe seu link.</li>
            <li>Acompanhe seus ganhos no painel de Monetização.</li>
          </ul>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p class="text-yellow-800 font-medium">💰 O pagamento é feito via PayPal ou PIX ao atingir o valor mínimo.</p>
          </div>
        `
      }
    ]
  },
  {
    id: "security",
    title: "Segurança",
    icon: ShieldCheck,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    articles: [
      {
        id: "malicious-links",
        title: "Links maliciosos",
        content: `
          <h3 class="font-bold text-lg mb-2">Política de Segurança</h3>
          <p class="mb-4">O MKI Links PRO tem tolerância zero com links maliciosos:</p>
          <ul class="list-disc list-inside space-y-2 mb-4">
            <li>Phishing, malware e scams são proibidos.</li>
            <li>Links suspeitos são bloqueados automaticamente.</li>
            <li>Contas violadoras serão banidas permanentemente.</li>
          </ul>
        `
      }
    ]
  }
];

const quickFixes = [
  { title: "Não consigo fazer login", solution: "Verifique se seu email está correto ou redefina sua senha." },
  { title: "Meu link não abre", solution: "Confirme se a URL original é válida e começa com http:// ou https://." },
  { title: "Estatísticas não aparecem", solution: "As estatísticas podem levar até 5 minutos para atualizar." },
  { title: "Página mostra erro", solution: "Tente limpar o cache do navegador ou recarregar a página." }
];

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStartChat = () => {
    const sessionId = nanoid(12); // Generate random session ID
    navigate(`/support/chat/${sessionId}`);
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(art => 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-6 py-12 bg-gradient-to-b from-indigo-50 to-white rounded-3xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4"
        >
          <HelpCircle className="w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900">Como podemos ajudar?</h1>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Busque por dúvidas, erros ou tutoriais..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Fixes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickFixes.map((fix, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-600 font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Problema Comum</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{fix.title}</h3>
            <p className="text-sm text-gray-500">{fix.solution}</p>
          </motion.div>
        ))}
      </div>

      {/* Knowledge Base */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.bg} ${category.color}`}>
                  <category.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {category.articles.map((article) => (
                  <div key={article.id} className="group">
                    <button
                      onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {article.title}
                      </span>
                      {expandedArticle === article.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedArticle === article.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 text-gray-600 prose prose-indigo max-w-none"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Sidebar */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Precisa de mais ajuda?</h3>
              <p className="text-indigo-100 mb-6 text-sm">
                Nossa assistente virtual MKI AI está pronta para resolver seus problemas em tempo real.
              </p>
              <Button 
                onClick={handleStartChat}
                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-0 font-bold"
              >
                Iniciar Chat Seguro
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Horário de Atendimento</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Segunda - Sexta</span>
                <span className="font-medium text-gray-900">24h (IA)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sábado - Domingo</span>
                <span className="font-medium text-gray-900">24h (IA)</span>
              </div>
              <div className="pt-3 border-t border-gray-50 mt-3">
                <p className="text-xs text-gray-400">
                  * Atendimento humano disponível em casos complexos escalados pela IA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
