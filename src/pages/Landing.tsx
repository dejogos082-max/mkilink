import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Globe, 
  Check, 
  ArrowRight, 
  MousePointer2,
  Layout,
  Smartphone,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/Button';

export default function Landing() {
  const features = [
    {
      icon: Zap,
      title: "Encurtamento Rápido",
      description: "Transforme links longos em URLs curtas e memoráveis em segundos."
    },
    {
      icon: TrendingUp,
      title: "Monetização Integrada",
      description: "Ganhe dinheiro com cada clique em seus links através de nossa rede de anúncios."
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Acompanhe cliques, localização geográfica, dispositivos e muito mais em tempo real."
    },
    {
      icon: Layout,
      title: "Link na Bio",
      description: "Crie uma página personalizada para agrupar todos os seus links importantes."
    },
    {
      icon: Globe,
      title: "Domínios Personalizados",
      description: "Use sua própria marca nos links para aumentar a confiança e o CTR."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados e de seus usuários protegidos com as melhores práticas de segurança."
    }
  ];

  const plans = [
    {
      name: "Plano Free",
      price: "Grátis",
      features: [
        "Até 30 links curtos",
        "Até 10 links monetizados",
        "1 página link na bio",
        "5 campanhas",
        "Estatísticas básicas"
      ],
      buttonText: "Começar Grátis",
      highlight: false
    },
    {
      name: "Workspace Premium",
      price: "R$29/mês",
      features: [
        "Links ilimitados",
        "Monetização ilimitada",
        "Link na bio avançado",
        "Campanhas ilimitadas",
        "Analytics detalhado",
        "Domínio personalizado"
      ],
      buttonText: "Assinar Premium",
      highlight: true
    },
    {
      name: "Empresarial",
      price: "R$99/mês",
      features: [
        "Tudo do Premium",
        "Multi usuários",
        "API de links",
        "White label",
        "Suporte prioritário",
        "Gestor de conta"
      ],
      buttonText: "Falar com Vendas",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MKI Links</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">Recursos</a>
              <a href="#plans" className="text-gray-600 hover:text-indigo-600 font-medium">Planos</a>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Entrar</Link>
              <Link to="/register">
                <Button>Criar Conta Grátis</Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Link to="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Nova Plataforma 2.0 Disponível
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                O único encurtador que <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">paga você</span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Gerencie seus links, crie páginas de bio incríveis e monetize seu tráfego em uma única plataforma. Simples, poderoso e lucrativo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 text-lg px-8">
                    Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full h-14 text-lg px-8">
                    Acessar Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full w-full pointer-events-none"></div>
            <div className="rounded-3xl bg-gray-900 p-2 ring-1 ring-gray-900/10 shadow-2xl">
              <div className="rounded-2xl bg-gray-800 overflow-hidden border border-gray-700">
                {/* Mock Dashboard UI */}
                <div className="flex h-10 items-center gap-2 px-4 border-b border-gray-700 bg-gray-800/50">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="p-8 bg-gray-900 min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <div className="h-8 w-8 bg-indigo-500/20 rounded-lg mb-4"></div>
                      <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-gray-600 rounded"></div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <div className="h-8 w-8 bg-green-500/20 rounded-lg mb-4"></div>
                      <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-gray-600 rounded"></div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                      <div className="h-8 w-8 bg-purple-500/20 rounded-lg mb-4"></div>
                      <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                  <p className="text-gray-400">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-lg text-gray-500">
              Ferramentas profissionais para gerenciar, rastrear e monetizar sua presença online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Planos para todos os tamanhos
            </h2>
            <p className="text-lg text-gray-500">
              Comece grátis e escale conforme seu crescimento. Sem surpresas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border ${plan.highlight ? 'border-indigo-600 shadow-xl scale-105 z-10' : 'border-gray-200 shadow-sm'} bg-white flex flex-col`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-3xl font-extrabold text-gray-900 mb-6">{plan.price}</div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.highlight ? 'primary' : 'outline'}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            Pronto para revolucionar seus links?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de criadores e empresas que já usam o MKI Links para crescer.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 border-0 h-14 px-10 text-lg">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-indigo-500" />
                <span className="text-xl font-bold">MKI Links</span>
              </div>
              <p className="text-gray-400 max-w-xs">
                A plataforma completa para gestão de links, bio pages e monetização de tráfego.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Recursos</a></li>
                <li><a href="#plans" className="hover:text-white">Preços</a></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} MKI Links. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
