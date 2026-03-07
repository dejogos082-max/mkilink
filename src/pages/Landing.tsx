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
  Check
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
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/30 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-400/30 blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-400/20 blur-[100px]"
        />
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#F5F5F7]/80 backdrop-blur-md border-b border-[#D2D2D7]/30 transition-all duration-300">
        <div className="max-w-[980px] mx-auto px-4 h-14 flex items-center justify-between text-sm font-medium tracking-wide">
          <Link to="/" className="text-[#1D1D1F] hover:opacity-80 transition-opacity flex items-center gap-2">
            <div className="bg-[#0071E3] p-1.5 rounded-lg">
              <Zap className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-semibold tracking-tight">MKI Links</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[#424245] hover:text-[#1D1D1F] transition-colors">
              Entrar
            </Link>
            <Link to="/register">
              <button className="bg-[#0071E3] text-white px-4 py-1.5 rounded-full hover:bg-[#0077ED] transition-colors shadow-sm">
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
          <div className="max-w-[980px] mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-5xl md:text-8xl font-semibold tracking-tighter mb-6 text-[#1D1D1F] pb-2">
                Gestão de links. <br />
                <span className="text-[#6E6E73]">Simples. Poderosa.</span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[#1D1D1F] text-xl md:text-2xl font-medium max-w-2xl mx-auto mt-6 leading-relaxed"
            >
              A plataforma definitiva para encurtar, monitorar e monetizar. <br className="hidden md:block" />
              Tudo o que você precisa em um só lugar.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link to="/register" className="bg-[#0071E3] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#0077ED] transition-colors shadow-md hover:shadow-lg">
                Começar agora
              </Link>
              <Link to="/demo" className="text-[#0066CC] text-lg hover:underline flex items-center gap-1 group font-medium">
                Ver demonstração <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlight */}
        <section className="px-4 md:px-0 mb-32">
          <FadeIn>
            <div className="max-w-[1200px] mx-auto aspect-video md:aspect-[21/9] bg-white/60 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center overflow-hidden relative shadow-2xl shadow-black/5 border border-white">
               <div className="text-center z-10 p-8">
                 <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 mx-auto mb-8 shadow-inner flex items-center justify-center border border-blue-100/50">
                    <LinkIcon className="w-12 h-12 md:w-16 md:h-16 text-[#0071E3]" strokeWidth={1.5} />
                 </div>
                 <h3 className="text-3xl md:text-5xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">Performance Incomparável.</h3>
                 <p className="text-[#86868B] font-medium text-lg md:text-xl max-w-2xl mx-auto">
                   Redirecionamentos instantâneos com infraestrutura global de baixa latência. Seus links sempre online.
                 </p>
               </div>
            </div>
          </FadeIn>
        </section>

        {/* Bento Grid Features */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-6xl font-semibold text-[#1D1D1F] mb-16 tracking-tight text-center">
                Tudo o que você precisa. <br />
                <span className="text-[#86868B]">Em um único workspace.</span>
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 - Encurtador */}
              <FadeIn delay={0.1} className="md:col-span-2">
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-white shadow-sm">
                  <div className="max-w-md">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                      <LinkIcon className="w-7 h-7 text-[#0071E3]" />
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">Links Curtos.</h3>
                    <p className="text-[#86868B] text-lg font-medium leading-relaxed">
                      Crie links curtos, rápidos e personalizados. Compartilhe em qualquer lugar com QR Codes automáticos e redirecionamento inteligente.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 2 - Monetization */}
              <FadeIn delay={0.2}>
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-white shadow-sm">
                  <div>
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                      <TrendingUp className="w-7 h-7 text-[#30D158]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">Monetização.</h3>
                    <p className="text-[#86868B] font-medium mb-6">Transforme cliques em receita com anúncios integrados.</p>
                  </div>
                  <div className="text-4xl font-bold text-[#1D1D1F] tracking-tighter">
                    R$1.240<span className="text-[#86868B] text-xl">,50</span>
                  </div>
                </div>
              </FadeIn>

              {/* Card 3 - Analytics */}
              <FadeIn delay={0.3}>
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-white shadow-sm">
                  <div>
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                      <BarChart3 className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">Analytics Pro.</h3>
                    <p className="text-[#86868B] font-medium">Dados detalhados de cliques, localização e dispositivos em tempo real.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 4 - Link in Bio */}
              <FadeIn delay={0.4}>
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-white shadow-sm">
                  <div>
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                      <Smartphone className="w-7 h-7 text-[#BF5AF2]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">Link na Bio.</h3>
                    <p className="text-[#86868B] font-medium">Sua página pessoal com todos os seus links importantes. Bonita e responsiva.</p>
                  </div>
                </div>
              </FadeIn>

              {/* Card 5 - Campaigns */}
              <FadeIn delay={0.5}>
                <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl h-full min-h-[350px] flex flex-col justify-between group hover:shadow-xl transition-all duration-500 border border-white shadow-sm">
                  <div>
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                      <Layers className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">Campanhas.</h3>
                    <p className="text-[#86868B] font-medium">Agrupe links e meça o desempenho de campanhas inteiras com facilidade.</p>
                  </div>
                </div>
              </FadeIn>

            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id="plans" className="py-32 px-6">
          <div className="max-w-[980px] mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
                  Planos simples.
                </h2>
                <p className="text-xl text-[#86868B] font-medium">
                  Escolha o plano ideal para o seu momento.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <FadeIn delay={0.1}>
                <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
                  <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-2">Grátis</h3>
                  <p className="text-[#86868B] font-medium mb-6">Para começar a explorar.</p>
                  <div className="text-5xl font-bold text-[#1D1D1F] tracking-tighter mb-8">
                    R$0<span className="text-lg text-[#86868B] font-medium tracking-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {['Até 30 links curtos', '2 links monetizados', '1 página de Link na Bio', 'Analytics básico'].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#1D1D1F] font-medium">
                        <Check className="w-5 h-5 text-[#0071E3]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full">
                    <button className="w-full py-4 rounded-full bg-[#F5F5F7] text-[#1D1D1F] font-semibold hover:bg-[#E8E8ED] transition-colors">
                      Criar conta grátis
                    </button>
                  </Link>
                </div>
              </FadeIn>

              {/* Premium Plan */}
              <FadeIn delay={0.2}>
                <div className="bg-white p-10 rounded-[2.5rem] border-2 border-[#0071E3] shadow-2xl hover:shadow-3xl transition-all h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#0071E3] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                    MAIS POPULAR
                  </div>
                  <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-2">Premium</h3>
                  <p className="text-[#86868B] font-medium mb-6">Para profissionais e criadores.</p>
                  <div className="text-5xl font-bold text-[#1D1D1F] tracking-tighter mb-8">
                    R$29<span className="text-lg text-[#86868B] font-medium tracking-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {['Links curtos ilimitados', 'Monetização ilimitada', 'Páginas de Bio ilimitadas', 'Analytics avançado em tempo real', 'Domínios personalizados'].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#1D1D1F] font-medium">
                        <Check className="w-5 h-5 text-[#0071E3]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="w-full">
                    <button className="w-full py-4 rounded-full bg-[#0071E3] text-white font-semibold hover:bg-[#0077ED] transition-colors shadow-md">
                      Assinar Premium
                    </button>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-[600px] mx-auto">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] mb-6 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-[#86868B] text-xl mb-10">
                Crie sua conta em segundos. Sem cartão de crédito.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <button className="bg-[#0071E3] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#0077ED] transition-colors shadow-md">
                    Criar conta grátis
                  </button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-[#D2D2D7]/30 text-sm text-[#86868B] bg-white/50 backdrop-blur-sm">
          <div className="max-w-[980px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p>Copyright © {new Date().getFullYear()} MKI Links. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacidade</a>
              <a href="#" className="hover:text-[#1D1D1F] transition-colors">Termos de Uso</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
