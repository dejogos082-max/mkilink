import React, { useEffect } from 'react';
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
  BarChart3,
  Link as LinkIcon,
  Users,
  Briefcase,
  Layers,
  PieChart
} from 'lucide-react';
import { Button } from '../components/Button';
import { ParticleBackground } from '../components/ParticleBackground';
import { CursorGlow } from '../components/CursorGlow';
import { MouseParallax } from '../components/MouseParallax';
import { TiltCard } from '../components/TiltCard';

export default function Landing() {
  const features = [
    {
      icon: LinkIcon,
      title: "Links Curtos",
      description: "Crie links curtos rápidos e compartilhe em qualquer lugar.",
      items: ["Slug personalizado", "QR Code automático", "Redirecionamento inteligente"]
    },
    {
      icon: TrendingUp,
      title: "Links Monetizados",
      description: "Transforme tráfego em receita.",
      items: ["Página intermediária", "Contagem regressiva", "Redirecionamento final"]
    },
    {
      icon: Layout,
      title: "Link na Bio",
      description: "Crie uma página pública com todos os seus links importantes.",
      items: ["Perfil personalizado", "Botões de redes sociais", "Analytics de visitas"]
    },
    {
      icon: Layers,
      title: "Campanhas de Links",
      description: "Organize links por campanhas.",
      items: ["Agrupar links", "Medir desempenho", "Acompanhar tráfego"]
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Veja exatamente de onde vêm seus cliques.",
      items: ["País", "Dispositivo", "Origem", "Quantidade de cliques"]
    }
  ];

  const useCases = [
    {
      title: "Criadores de Conteúdo",
      icon: Smartphone,
      items: ["Link na bio", "Analytics de audiência", "Centralização de links"]
    },
    {
      title: "Afiliados",
      icon: TrendingUp,
      items: ["Monetização de links", "Controle de campanhas", "Rastreamento de tráfego"]
    },
    {
      title: "Empresas",
      icon: Briefcase,
      items: ["Gestão de links", "Análise de tráfego", "Campanhas organizadas"]
    }
  ];

  const plans = [
    {
      name: "Free",
      description: "Para começar",
      price: "Grátis",
      features: [
        "30 links curtos",
        "2 links monetizados",
        "1 página bio",
        "1 campanha",
        "Analytics básico"
      ],
      buttonText: "Criar conta grátis",
      highlight: false
    },
    {
      name: "Workspace Premium",
      description: "Plano mais popular",
      price: "R$29/mês",
      features: [
        "Links ilimitados",
        "Monetização ilimitada",
        "Bio links ilimitados",
        "Campanhas ilimitadas",
        "Analytics avançado",
        "Domínio personalizado"
      ],
      buttonText: "Assinar Premium",
      highlight: true
    },
    {
      name: "Workspace Empresarial",
      description: "Para equipes",
      price: "R$99/mês",
      features: [
        "Multi usuários",
        "API",
        "Domínios ilimitados",
        "Analytics profissional",
        "White label"
      ],
      buttonText: "Falar com Vendas",
      highlight: false
    }
  ];

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (window.innerWidth >= 768) return; // Only mobile
      const background = document.getElementById('gyro-background');
      if (background && event.beta !== null && event.gamma !== null) {
        background.style.transform = `rotateX(${event.beta / 20}deg) rotateY(${event.gamma / 20}deg)`;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div id="gyro-background" className="min-h-screen bg-white font-sans text-gray-900 relative overflow-hidden transition-transform duration-100 ease-out">
      <ParticleBackground />
      <CursorGlow />
      
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
              <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">Funcionalidades</a>
              <a href="#plans" className="text-gray-600 hover:text-indigo-600 font-medium">Planos</a>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Fazer Login</Link>
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
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <MouseParallax 
            className="w-full h-full absolute inset-0 pointer-events-none"
            layers={[
              {
                depth: 15,
                content: <div className="w-64 h-64 bg-indigo-100 rounded-full opacity-20 absolute -top-20 -left-20"></div>
              },
              {
                depth: -10,
                content: <div className="w-72 h-72 bg-purple-100 rounded-full opacity-20 absolute top-40 -right-20"></div>
              }
            ]}
          />
          
          <div className="text-center max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                Controle todos os seus links em um único <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">workspace</span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Encurte links, monetize tráfego, crie páginas de bio e acompanhe analytics avançados em tempo real.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="inline-block w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-8 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300">
                    Criar conta grátis
                  </Button>
                </Link>
                <Link to="/login" className="inline-block w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg px-8 rounded-full">
                    Fazer login
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
            className="mt-20 relative z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full w-full pointer-events-none"></div>
            <TiltCard tiltMaxAngleX={5} tiltMaxAngleY={5} className="max-w-5xl mx-auto">
              <div className="rounded-3xl bg-gray-900 p-2 ring-1 ring-gray-900/10 shadow-2xl transform hover:scale-[1.01] transition-transform duration-500">
                <div className="rounded-2xl bg-gray-50 overflow-hidden border border-gray-200">
                {/* Mock Dashboard UI */}
                <div className="flex h-10 items-center gap-2 px-4 border-b border-gray-200 bg-white">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <div className="ml-4 h-4 w-64 bg-gray-100 rounded-full"></div>
                </div>
                <div className="p-8 bg-gray-50 min-h-[400px]">
                  {/* Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                      { label: "Total de Cliques", val: "12,453", color: "bg-indigo-500" },
                      { label: "Performance", val: "4.8%", color: "bg-green-500" },
                      { label: "Total de Links", val: "142", color: "bg-purple-500" },
                      { label: "Campanhas", val: "8", color: "bg-orange-500" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className={`h-10 w-10 ${stat.color} rounded-lg mb-4 opacity-20`}></div>
                        <div className="h-4 w-24 bg-gray-100 rounded mb-2"></div>
                        <div className="text-2xl font-bold text-gray-800">{stat.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Content Row */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64">
                      <div className="h-6 w-32 bg-gray-100 rounded mb-6"></div>
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 w-48 bg-gray-100 rounded mb-2"></div>
                              <div className="h-3 w-32 bg-gray-50 rounded"></div>
                            </div>
                            <div className="h-8 w-20 bg-gray-50 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64">
                      <div className="h-6 w-32 bg-gray-100 rounded mb-6"></div>
                      <div className="h-32 w-32 bg-indigo-50 rounded-full mx-auto mb-4 border-8 border-indigo-100"></div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-lg text-gray-500">
              Tudo que você precisa para gerenciar sua presença digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <TiltCard key={index} tiltMaxAngleX={8} tiltMaxAngleY={8}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-indigo-100 group h-full"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 mb-6 min-h-[48px]">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-indigo-900 text-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Para quem é o MKI Links?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <TiltCard key={index} tiltMaxAngleX={10} tiltMaxAngleY={10}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-2xl border border-indigo-700/50 h-full"
                >
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 text-white">
                    <useCase.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-6">{useCase.title}</h3>
                  <ul className="space-y-3">
                    {useCase.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-indigo-100">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Planos Flexíveis
            </h2>
            <p className="text-lg text-gray-500">
              Escolha o plano ideal para o seu momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <TiltCard key={index} tiltMaxAngleX={5} tiltMaxAngleY={5} className={plan.highlight ? "z-20" : "z-10"}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-8 rounded-2xl border ${plan.highlight ? 'border-indigo-600 shadow-2xl bg-white md:scale-105' : 'border-gray-200 shadow-sm bg-gray-50'} flex flex-col h-full`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Mais Popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">{plan.price}</div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlight ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full mt-auto">
                    <Button 
                      className="w-full h-12 text-base" 
                      variant={plan.highlight ? 'primary' : 'outline'}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </motion.div>
              </TiltCard>
            ))}
          </div>

          {/* Quick Comparison Table */}
          <div className="mt-20 max-w-4xl mx-auto overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-900 font-semibold">
                <tr>
                  <th className="px-6 py-4">Recurso</th>
                  <th className="px-6 py-4 text-center">Free</th>
                  <th className="px-6 py-4 text-center text-indigo-600">Premium</th>
                  <th className="px-6 py-4 text-center">Empresarial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="px-6 py-4 font-medium">Links Curtos</td>
                  <td className="px-6 py-4 text-center text-gray-500">30</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600">Ilimitado</td>
                  <td className="px-6 py-4 text-center text-gray-900">Ilimitado</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Monetização</td>
                  <td className="px-6 py-4 text-center text-gray-500">2 links</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600">Ilimitado</td>
                  <td className="px-6 py-4 text-center text-gray-900">Ilimitado</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Domínio Próprio</td>
                  <td className="px-6 py-4 text-center text-gray-300">—</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-900">Ilimitado</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">API Access</td>
                  <td className="px-6 py-4 text-center text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-300">—</td>
                  <td className="px-6 py-4 text-center text-gray-900"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500 rounded-full opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500 rounded-full opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Comece a gerenciar seus links agora.
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Crie sua conta gratuita e descubra todas as ferramentas do workspace.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 border-0 h-14 px-10 text-lg font-bold">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MKI Links</span>
            </div>
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MKI Links. Todos os direitos reservados.
            </div>
            <div className="flex gap-6 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-indigo-600">Termos</a>
              <a href="#" className="hover:text-indigo-600">Privacidade</a>
              <a href="#" className="hover:text-indigo-600">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
