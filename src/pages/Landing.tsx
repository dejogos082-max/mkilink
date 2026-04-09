import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Zap, 
  BarChart3, 
  Globe, 
  ShieldCheck, 
  ChevronRight,
  Smartphone,
  Layers,
  TrendingUp,
  Link as LinkIcon,
  Check,
  ArrowRight
} from 'lucide-react';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#111827] selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-400/20 blur-[150px]"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-[#111827] hover:opacity-80 transition-opacity flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-bold tracking-tight text-lg">MKI Links</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link to="/register">
              <button className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                Criar conta
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Wrapper (z-10 to stay above background) */}
      <div className="relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                A plataforma completa para seus links
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 text-[#111827] leading-[1.1]">
                Gestão de links. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Simples e Poderosa.
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-600 text-lg md:text-xl font-medium max-w-2xl mx-auto mt-6 leading-relaxed"
            >
              A plataforma definitiva para encurtar, monitorar e monetizar. <br className="hidden md:block" />
              Tudo o que você precisa em um único workspace profissional.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/register" className="w-full sm:w-auto bg-[#111827] text-white px-8 py-3.5 rounded-xl text-base font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                Começar gratuitamente <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/demo" className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2 group">
                Ver demonstração
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlight */}
        <section className="px-4 md:px-6 mb-32">
          <FadeIn>
            <div className="max-w-6xl mx-auto aspect-video md:aspect-[21/9] bg-white rounded-[2rem] flex items-center justify-center overflow-hidden relative shadow-xl border border-gray-100">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
               <div className="text-center z-10 p-8">
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white mx-auto mb-8 shadow-md flex items-center justify-center border border-gray-100">
                    <Zap className="w-10 h-10 md:w-12 md:h-12 text-blue-600" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-3xl md:text-5xl font-bold text-[#111827] mb-4 tracking-tight">Performance Incomparável.</h3>
                 <p className="text-gray-600 font-medium text-lg md:text-xl max-w-2xl mx-auto">
                   Redirecionamentos instantâneos com infraestrutura global de baixa latência. Seus links sempre online e rápidos.
                 </p>
               </div>
            </div>
          </FadeIn>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#111827] mb-4 tracking-tight">
                  Tudo o que você precisa.
                </h2>
                <p className="text-xl text-gray-600 font-medium">
                  Em um único workspace profissional.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 - Encurtador */}
              <FadeIn delay={0.1} className="md:col-span-2">
                <div className="bg-white p-10 rounded-[2rem] h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LinkIcon className="w-32 h-32 text-blue-600" />
                  </div>
                  <div className="max-w-md relative z-10">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                      <LinkIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#111827] mb-3 tracking-tight">Links Curtos Profissionais</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Crie links curtos, rápidos e personalizados. Compartilhe em qualquer lugar com QR Codes automáticos e redirecionamento inteligente.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 2 - Monetization */}
              <FadeIn delay={0.2}>
                <div className="bg-white p-10 rounded-[2rem] h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 border border-emerald-100">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111827] mb-3 tracking-tight">Monetização</h3>
                    <p className="text-gray-600 mb-6">Transforme cliques em receita com anúncios integrados.</p>
                  </div>
                  <div className="text-3xl font-bold text-[#111827] tracking-tighter relative z-10">
                    R$1.240<span className="text-gray-400 text-lg">,50</span>
                  </div>
                </div>
              </FadeIn>

              {/* Card 3 - Analytics */}
              <FadeIn delay={0.3}>
                <div className="bg-white p-10 rounded-[2rem] h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-gray-100 shadow-sm">
                  <div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 border border-indigo-100">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111827] mb-3 tracking-tight">Analytics Pro</h3>
                    <p className="text-gray-600">Dados detalhados de cliques, localização e dispositivos em tempo real.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 4 - Link in Bio */}
              <FadeIn delay={0.4}>
                <div className="bg-white p-10 rounded-[2rem] h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-gray-100 shadow-sm">
                  <div>
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 border border-purple-100">
                      <Smartphone className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111827] mb-3 tracking-tight">Link na Bio</h3>
                    <p className="text-gray-600">Sua página pessoal com todos os seus links importantes. Bonita e responsiva.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 5 - Campaigns */}
              <FadeIn delay={0.5}>
                <div className="bg-white p-10 rounded-[2rem] h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-gray-100 shadow-sm">
                  <div>
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6 border border-orange-100">
                      <Layers className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#111827] mb-3 tracking-tight">Campanhas</h3>
                    <p className="text-gray-600">Agrupe links e meça o desempenho de campanhas inteiras com facilidade.</p>
                  </div>
                </div>
              </FadeIn>

            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id="plans" className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-[#111827] tracking-tight mb-4">
                  Planos simples e transparentes.
                </h2>
                <p className="text-xl text-gray-600 font-medium">
                  Escolha o plano ideal para o seu momento.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <FadeIn delay={0.1}>
                <div className="bg-white p-10 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-[#111827] mb-2">Grátis</h3>
                  <p className="text-gray-500 font-medium mb-6">Para começar a explorar.</p>
                  <div className="text-5xl font-bold text-[#111827] tracking-tighter mb-8">
                    R$0<span className="text-lg text-gray-500 font-medium tracking-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {['Até 30 links curtos', '2 links monetizados', '1 página de Link na Bio', 'Analytics básico'].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                        <Check className="w-5 h-5 text-blue-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full">
                    <button className="w-full py-3.5 rounded-xl bg-gray-50 text-gray-900 font-semibold border border-gray-200 hover:bg-gray-100 transition-colors">
                      Criar conta grátis
                    </button>
                  </Link>
                </div>
              </FadeIn>

              {/* Premium Plan */}
              <FadeIn delay={0.2}>
                <div className="bg-white p-10 rounded-[2rem] border-2 border-blue-600 shadow-xl hover:shadow-2xl transition-all h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                    MAIS POPULAR
                  </div>
                  <h3 className="text-2xl font-bold text-[#111827] mb-2">Premium</h3>
                  <p className="text-gray-500 font-medium mb-6">Para profissionais e criadores.</p>
                  <div className="text-5xl font-bold text-[#111827] tracking-tighter mb-8">
                    R$29<span className="text-lg text-gray-500 font-medium tracking-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {['Links curtos ilimitados', 'Monetização ilimitada', 'Páginas de Bio ilimitadas', 'Analytics avançado em tempo real', 'Domínios personalizados'].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                        <Check className="w-5 h-5 text-blue-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full">
                    <button className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md">
                      Assinar Premium
                    </button>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-24 px-6 text-center bg-white border-y border-gray-200/50">
          <div className="max-w-[600px] mx-auto">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold text-[#111827] mb-6 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-gray-600 text-xl mb-10">
                Crie sua conta em segundos. Sem cartão de crédito.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <button className="bg-[#111827] text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors shadow-md">
                    Criar conta grátis
                  </button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 text-sm text-gray-500 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p>Copyright © {new Date().getFullYear()} MKI Links. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Termos de Uso</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
