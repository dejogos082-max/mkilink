import React from 'react';
import { motion } from 'motion/react';
import { Check, Shield, Zap, Star, Crown, Building, Users, Rocket, Globe, Gem } from 'lucide-react';
import { Button } from '../components/Button';

const plans = [
  {
    name: "Free",
    price: "0",
    features: ["1 Link", "Analytics Básico", "Tema Padrão"],
    icon: Star,
    color: "bg-gray-500",
    popular: false
  },
  {
    name: "Starter",
    price: "9,90",
    features: ["3 Links", "Analytics Básico", "Temas Padrão"],
    icon: Zap,
    color: "bg-blue-500",
    popular: false
  },
  {
    name: "Basic",
    price: "19,90",
    features: ["5 Links", "Analytics Avançado", "Temas Premium"],
    icon: Shield,
    color: "bg-green-500",
    popular: false
  },
  {
    name: "Premium",
    price: "29,90",
    features: ["Links Ilimitados", "Analytics Avançado", "Todos os Temas", "Suporte Prioritário"],
    icon: Crown,
    color: "bg-purple-500",
    popular: true
  },
  {
    name: "Pro",
    price: "49,90",
    features: ["Tudo do Premium", "Domínio Personalizado", "Remoção de Branding"],
    icon: Rocket,
    color: "bg-indigo-500",
    popular: false
  },
  {
    name: "Pós",
    price: "79,90",
    features: ["Tudo do Pro", "Gestão de Equipe (3 membros)", "API Access"],
    icon: Users,
    color: "bg-orange-500",
    popular: false
  },
  {
    name: "Scaled",
    price: "149,90",
    features: ["Tudo do Pós", "Gestão de Equipe (10 membros)", "Whitelabel"],
    icon: Building,
    color: "bg-red-500",
    popular: false
  },
  {
    name: "Empresarial",
    price: "299,90",
    features: ["Solução Customizada", "Gerente de Conta", "SLA Garantido", "SSO"],
    icon: Globe,
    color: "bg-slate-800",
    popular: false
  },
  {
    name: "Ultimate",
    price: "499,90",
    features: ["Infraestrutura Dedicada", "Auditoria de Segurança", "Treinamento"],
    icon: Gem,
    color: "bg-emerald-600",
    popular: false
  },
  {
    name: "Influenciadores",
    price: "Consultar",
    features: ["Parceria Exclusiva", "Verificação", "Destaque na Plataforma"],
    icon: Star,
    color: "bg-pink-500",
    popular: false
  }
];

export default function Plans() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Escolha o plano ideal
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Desbloqueie todo o potencial dos seus links com nossos planos flexíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex flex-col bg-white rounded-2xl shadow-xl ring-1 ring-gray-900/5 overflow-hidden ${plan.popular ? 'ring-2 ring-indigo-600 scale-105 z-10' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                MAIS POPULAR
              </div>
            )}
            
            <div className={`p-6 ${plan.color} bg-opacity-10`}>
              <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                <plan.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline text-gray-900">
                {plan.price !== "Consultar" && <span className="text-3xl font-extrabold tracking-tight">R$</span>}
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                {plan.price !== "Consultar" && <span className="ml-1 text-xl font-semibold text-gray-500">/mês</span>}
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-between bg-white">
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="ml-3 text-sm text-gray-500">{feature}</p>
                  </li>
                ))}
              </ul>
              
              <Button className="w-full" variant={plan.popular ? 'primary' : 'secondary'}>
                {plan.price === "Consultar" ? "Falar com Vendas" : "Começar Agora"}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
