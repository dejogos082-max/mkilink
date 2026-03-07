import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  TrendingUp, 
  Check, 
  ArrowRight, 
  Layout,
  Smartphone,
  BarChart3,
  Link as LinkIcon,
  Briefcase,
  Layers
} from 'lucide-react';
import { Button } from '../components/Button';
import { ParticleBackground } from '../components/landing/ParticleBackground';
import { CursorGlow } from '../components/landing/CursorGlow';
import { TiltCard } from '../components/landing/TiltCard';
import { MouseParallax } from '../components/landing/MouseParallax';

export default function Landing() {
  const features = [
    { icon: LinkIcon, title: "Links Curtos", description: "Crie links curtos rápidos e compartilhe em qualquer lugar.", items: ["Slug personalizado", "QR Code automático", "Redirecionamento inteligente"] },
    { icon: TrendingUp, title: "Links Monetizados", description: "Transforme tráfego em receita.", items: ["Página intermediária", "Contagem regressiva", "Redirecionamento final"] },
    { icon: Layout, title: "Link na Bio", description: "Crie uma página pública com todos os seus links importantes.", items: ["Perfil personalizado", "Botões de redes sociais", "Analytics de visitas"] },
    { icon: Layers, title: "Campanhas de Links", description: "Organize links por campanhas.", items: ["Agrupar links", "Medir desempenho", "Acompanhar tráfego"] },
    { icon: BarChart3, title: "Analytics Avançado", description: "Veja exatamente de onde vêm seus cliques.", items: ["País", "Dispositivo", "Origem", "Quantidade de cliques"] }
  ];

  const useCases = [
    { title: "Criadores de Conteúdo", icon: Smartphone, items: ["Link na bio", "Analytics de audiência", "Centralização de links"] },
    { title: "Afiliados", icon: TrendingUp, items: ["Monetização de links", "Controle de campanhas", "Rastreamento de tráfego"] },
    { title: "Empresas", icon: Briefcase, items: ["Gestão de links", "Análise de tráfego", "Campanhas organizadas"] }
  ];

  const plans = [
    { name: "Free", description: "Para começar", price: "Grátis", features: ["30 links curtos", "2 links monetizados", "1 página bio", "1 campanha", "Analytics básico"], buttonText: "Criar conta grátis", highlight: false },
    { name: "Workspace Premium", description: "Plano mais popular", price: "R$29/mês", features: ["Links ilimitados", "Monetização ilimitada", "Bio links ilimitados", "Campanhas ilimitadas", "Analytics avançado", "Domínio personalizado"], buttonText: "Assinar Premium", highlight: true },
    { name: "Workspace Empresarial", description: "Para equipes", price: "R$99/mês", features: ["Multi usuários", "API", "Domínios ilimitados", "Analytics profissional", "White label"], buttonText: "Falar com Vendas", highlight: false }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <MouseParallax layers={[
            { depth: 10, children: (
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                  Controle todos os seus links em um único <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">workspace</span>
                </h1>
                <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Encurte links, monetize tráfego, crie páginas de bio e acompanhe analytics avançados em tempo real.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full h-14 text-lg px-8">
                      Criar conta grátis <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full h-14 text-lg px-8">
                      Fazer login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          ]} />
        </div>
      </section>

      {/* What is it Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
              Um workspace completo para gestão de links
            </h2>
            <p className="text-lg text-gray-500">
              Uma plataforma para encurtar links, organizar campanhas, monetizar tráfego e acompanhar estatísticas detalhadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              "Encurtador profissional",
              "Links monetizados",
              "Link na bio",
              "Campanhas de marketing",
              "Analytics avançado"
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 font-semibold text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <TiltCard key={index} className="h-full">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-indigo-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">
              Para quem é o MKI Links?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-indigo-800/50 backdrop-blur-sm p-8 rounded-2xl border border-indigo-700/50">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <TiltCard key={index} className="h-full">
                <div className={`p-8 rounded-2xl border ${plan.highlight ? 'border-indigo-600 shadow-2xl bg-white' : 'border-gray-200 shadow-sm bg-gray-50'} flex flex-col h-full`}>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="text-4xl font-extrabold text-gray-900 my-6">{plan.price}</div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full">
                    <Button className="w-full h-12 text-base" variant={plan.highlight ? 'primary' : 'outline'}>
                      {plan.buttonText}
                    </Button>
                  </Link>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
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
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} MKI Links. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
