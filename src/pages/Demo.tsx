import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  BarChart3, 
  Smartphone, 
  Layers, 
  TrendingUp, 
  Link as LinkIcon,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] selection:bg-blue-100 selection:text-blue-900 pb-20 relative overflow-hidden">
      
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
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#F5F5F7]/80 backdrop-blur-md border-b border-[#D2D2D7]/30">
        <div className="max-w-[980px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-[#1D1D1F] hover:opacity-80 transition-opacity flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/register">
              <button className="bg-[#0071E3] text-white px-4 py-1.5 rounded-full hover:bg-[#0077ED] transition-colors shadow-sm text-sm font-medium">
                Criar conta
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-32 pb-16 px-6 text-center max-w-3xl mx-auto relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
        >
          Demonstração MKI Links
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-[#86868B]"
        >
          Conheça todas as ferramentas que vão transformar a forma como você gerencia seus links.
        </motion.p>
      </header>

      {/* Features Showcase */}
      <div className="max-w-[980px] mx-auto px-6 space-y-24 relative z-10">
        
        {/* Feature 1 */}
        <FadeIn>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-white flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <LinkIcon className="w-6 h-6 text-[#0071E3]" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Encurtador de Links</h2>
              <p className="text-lg text-[#86868B] mb-6">
                Crie links curtos personalizados com o seu domínio. Adicione senhas, datas de expiração e tags para organização.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Domínios personalizados</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> QR Codes automáticos</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Redirecionamento condicional</li>
              </ul>
            </div>
            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-6 w-full aspect-video flex items-center justify-center border border-[#D2D2D7]/30">
              <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"></div>
                <div className="h-10 border border-gray-200 rounded-lg flex items-center px-3 text-gray-400 mb-2 text-sm">https://seusite.com/url-longa</div>
                <div className="h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center px-3 text-blue-600 font-medium text-sm">mki.link/promo</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Feature 2 */}
        <FadeIn>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-white flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-[#30D158]" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Monetização Integrada</h2>
              <p className="text-lg text-[#86868B] mb-6">
                Ganhe dinheiro com cada clique. Exiba anúncios não intrusivos antes do redirecionamento e acompanhe seus ganhos em tempo real.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> CPM competitivo</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Saques rápidos via PIX</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Relatórios de ganhos detalhados</li>
              </ul>
            </div>
            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-6 w-full aspect-video flex items-center justify-center border border-[#D2D2D7]/30">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1 font-medium">Saldo Disponível</div>
                <div className="text-5xl font-bold text-[#1D1D1F]">R$ 450,00</div>
                <div className="mt-4 px-4 py-2 bg-[#30D158] text-white rounded-full text-sm font-medium inline-block shadow-sm">Solicitar Saque</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Feature 3 */}
        <FadeIn>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-white flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Analytics Avançado</h2>
              <p className="text-lg text-[#86868B] mb-6">
                Entenda seu público. Saiba de onde vêm os cliques, quais dispositivos usam e em quais horários são mais ativos.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Mapa de calor por país/cidade</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Gráficos de dispositivos</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Exportação de dados (CSV/PDF)</li>
              </ul>
            </div>
            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-6 w-full aspect-video flex items-end justify-between gap-2 border border-[#D2D2D7]/30">
              {[30, 50, 40, 70, 60, 90, 80].map((h, i) => (
                <div key={i} className="w-full bg-indigo-500 rounded-t-md opacity-80" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Feature 4 */}
        <FadeIn>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-white flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-[#BF5AF2]" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Link na Bio</h2>
              <p className="text-lg text-[#86868B] mb-6">
                Crie uma página responsiva e bonita para agrupar todos os seus links importantes. Perfeito para o Instagram e TikTok.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Temas personalizáveis</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Integração com redes sociais</li>
                <li className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-5 h-5 text-[#30D158]" /> Botões animados</li>
              </ul>
            </div>
            <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-6 w-full aspect-video flex items-center justify-center border border-[#D2D2D7]/30">
              <div className="w-40 h-64 bg-white rounded-2xl shadow-md border-4 border-gray-800 p-2 flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="w-full h-6 bg-purple-100 rounded mb-2"></div>
                <div className="w-full h-6 bg-purple-100 rounded mb-2"></div>
                <div className="w-full h-6 bg-purple-100 rounded"></div>
              </div>
            </div>
          </div>
        </FadeIn>

      </div>

      {/* Plans Comparison */}
      <div className="max-w-[980px] mx-auto px-6 mt-32 relative z-10">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">O que você ganha em cada plano</h2>
          
          <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden">
            <div className="grid grid-cols-3 border-b border-[#D2D2D7]/30 bg-[#F5F5F7]">
              <div className="p-6 font-semibold text-lg">Recurso</div>
              <div className="p-6 font-semibold text-lg text-center border-l border-[#D2D2D7]/30">Grátis</div>
              <div className="p-6 font-semibold text-lg text-center border-l border-[#D2D2D7]/30 text-[#0071E3]">Premium</div>
            </div>
            
            {[
              { name: 'Links Curtos', free: 'Até 30', pro: 'Ilimitado' },
              { name: 'Links Monetizados', free: 'Até 2', pro: 'Ilimitado' },
              { name: 'Páginas de Bio', free: '1 página', pro: 'Ilimitadas' },
              { name: 'Domínios Personalizados', free: '-', pro: 'Ilimitados' },
              { name: 'Retenção de Analytics', free: '30 dias', pro: '1 ano' },
              { name: 'Suporte', free: 'Comunidade', pro: 'Prioritário 24/7' },
              { name: 'Remoção de Marca MKI', free: '-', pro: 'Sim' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-[#D2D2D7]/30 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="p-4 md:p-6 text-[#424245] font-medium">{row.name}</div>
                <div className="p-4 md:p-6 text-center border-l border-[#D2D2D7]/30 font-medium">{row.free}</div>
                <div className="p-4 md:p-6 text-center border-l border-[#D2D2D7]/30 font-bold text-[#0071E3]">{row.pro}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* CTA */}
      <div className="text-center mt-32 px-6 relative z-10">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para elevar seus links?</h2>
          <Link to="/register">
            <button className="bg-[#0071E3] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#0077ED] transition-colors shadow-md">
              Criar conta agora
            </button>
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
