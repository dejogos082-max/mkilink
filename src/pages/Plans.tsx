import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Zap, Star, Crown, Building, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '../components/Button';

export default function Plans() {
  const plans = [
    {
      name: "Plano Free",
      description: "Para usuários que querem apenas encurtar links e testar a plataforma.",
      price: "Grátis",
      period: "",
      features: [
        "Até 30 links curtos",
        "Até 2 links monetizados",
        "1 página link na bio",
        "1 campanha",
        "Estatísticas básicas",
        "QR Code automático",
        "Domínio padrão da plataforma",
        "Histórico de cliques limitado (7 dias)"
      ],
      restrictions: [
        "Sem monetização avançada",
        "Sem campanhas múltiplas",
        "Sem analytics detalhado"
      ],
      buttonText: "Começar grátis",
      buttonVariant: "outline",
      popular: false,
      icon: Star,
      color: "bg-gray-100 text-gray-600"
    },
    {
      name: "Workspace Premium",
      description: "Para afiliados, criadores e marketing digital.",
      price: "R$29",
      period: "/ mês",
      features: [
        "Links curtos ilimitados",
        "Links monetizados ilimitados",
        "Páginas intermediárias tipo AdFly",
        "Link na bio avançado",
        "Campanhas ilimitadas",
        "Estatísticas avançadas",
        "Analytics de tráfego (países, dispositivos, origem)",
        "Custom slug",
        "Domínio personalizado",
        "QR codes personalizados",
        "Gestão de campanhas",
        "Notas para organização de links"
      ],
      restrictions: [],
      buttonText: "Assinar Premium",
      buttonVariant: "primary",
      popular: true,
      icon: Crown,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      name: "Workspace Empresarial",
      description: "Pensado para agências, empresas e equipes de marketing.",
      price: "R$99",
      period: "/ mês",
      features: [
        "Tudo do Premium +",
        "Multi workspace",
        "Multi usuários",
        "Permissões de equipe",
        "Analytics profissional",
        "Relatórios completos",
        "API de links",
        "Integrações",
        "Domínios ilimitados",
        "Links dinâmicos",
        "A/B testing de links",
        "White label",
        "Limite alto de tráfego",
        "Suporte prioritário"
      ],
      restrictions: [],
      buttonText: "Plano Empresarial",
      buttonVariant: "secondary",
      popular: false,
      icon: Building,
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const comparisonData = [
    { feature: "Links curtos", free: "30", premium: "Ilimitado", business: "Ilimitado" },
    { feature: "Links monetizados", free: "2", premium: "Ilimitado", business: "Ilimitado" },
    { feature: "Link na bio", free: "1", premium: "Ilimitado", business: "Ilimitado" },
    { feature: "Campanhas", free: "1", premium: "Ilimitado", business: "Ilimitado" },
    { feature: "Analytics", free: "Básico", premium: "Avançado", business: "Profissional" },
    { feature: "Domínio próprio", free: false, premium: true, business: true },
    { feature: "API", free: false, premium: false, business: true },
    { feature: "Multi usuário", free: false, premium: false, business: true },
    { feature: "White label", free: false, premium: false, business: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl"
        >
          Controle todos os seus links em um único workspace
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto text-xl text-gray-500"
        >
          Encurte links, monetize tráfego, crie páginas de bio e acompanhe analytics avançados em tempo real.
        </motion.p>
      </div>

      {/* Monetization Highlight Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
            <DollarSign className="w-12 h-12 text-yellow-300" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Ganhe dinheiro com seus links</h2>
        <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
          Maximize seus ganhos com nossa plataforma de monetização integrada. Redirecionamento inteligente e analytics detalhados para você lucrar mais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <TrendingUp className="w-8 h-8 text-green-300 mb-3" />
            <h3 className="font-bold text-lg mb-2">Monetização</h3>
            <p className="text-sm text-indigo-100">Transforme cliques em receita com nossas ferramentas de monetização.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <Zap className="w-8 h-8 text-yellow-300 mb-3" />
            <h3 className="font-bold text-lg mb-2">Redirecionamento</h3>
            <p className="text-sm text-indigo-100">Roteamento inteligente para maximizar a conversão do seu tráfego.</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            <BarChart3 className="w-8 h-8 text-blue-300 mb-3" />
            <h3 className="font-bold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-indigo-100">Dados precisos para otimizar suas campanhas e aumentar o ROI.</p>
          </div>
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex flex-col bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 overflow-hidden ${plan.popular ? 'ring-2 ring-indigo-600 scale-105 z-10' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Recomendado
              </div>
            )}
            
            <div className="p-8 flex-grow">
              <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mb-6`}>
                <plan.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500 min-h-[40px]">{plan.description}</p>
              
              <div className="mt-6 flex items-baseline text-gray-900">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-3" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
                {plan.restrictions.map((restriction) => (
                  <li key={restriction} className="flex items-start opacity-50">
                    <X className="h-5 w-5 text-gray-400 flex-shrink-0 mr-3" />
                    <span className="text-sm text-gray-500">{restriction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <Button 
                className="w-full" 
                variant={plan.buttonVariant as any}
                size="lg"
              >
                {plan.buttonText}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900">Comparativo de Recursos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-sm font-semibold text-gray-900">Recurso</th>
                <th className="p-6 text-sm font-semibold text-gray-900 text-center">Free</th>
                <th className="p-6 text-sm font-semibold text-indigo-600 text-center bg-indigo-50/30">Premium</th>
                <th className="p-6 text-sm font-semibold text-gray-900 text-center">Empresarial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisonData.map((row, index) => (
                <tr key={row.feature} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="p-6 text-sm font-medium text-gray-900">{row.feature}</td>
                  <td className="p-6 text-sm text-gray-500 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                    ) : row.free}
                  </td>
                  <td className="p-6 text-sm text-gray-900 text-center font-medium bg-indigo-50/10">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                    ) : row.premium}
                  </td>
                  <td className="p-6 text-sm text-gray-900 text-center">
                    {typeof row.business === 'boolean' ? (
                      row.business ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />
                    ) : row.business}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
