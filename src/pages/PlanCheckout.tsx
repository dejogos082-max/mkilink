import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, CreditCard, ShieldCheck, Lock, Calendar, Globe, User, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const PLANS = {
  free: { name: "Plano Free", price: 0 },
  premium: { name: "Workspace Premium", price: 29 },
  business: { name: "Workspace Empresarial", price: 99 }
};

export default function PlanCheckout() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  
  const [profileData, setProfileData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    document: '', // CPF/CNPJ
    country: 'Brasil',
    ccNumber: '',
    ccName: '',
    ccExpiry: '',
    ccCvv: ''
  });

  const selectedPlan = PLANS[planId as keyof typeof PLANS];

  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch user profile
    const profileRef = ref(db, `users/${currentUser.uid}/profile`);
    onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfileData(data);
        setFormData(prev => ({
          ...prev,
          fullName: data.fullName || '',
          birthDate: data.birthDate || '',
          document: data.document || '',
          // We don't overwrite country if it's not in profile, default is Brasil
        }));
      }
      setLoading(false);
    }, { onlyOnce: true });
  }, [currentUser]);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Plano não encontrado</h2>
          <Button onClick={() => navigate('/plans')} className="mt-4">Voltar para Planos</Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormatCC = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData(prev => ({ ...prev, ccNumber: formatted }));
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
    setFormData(prev => ({ ...prev, ccExpiry: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setProcessing(true);

    try {
      // Create Checkout Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/plans`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Erro ao iniciar o pagamento. Tente novamente.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao conectar com o servidor.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Button variant="ghost" onClick={() => navigate('/plans')} className="mb-8 pl-0 hover:bg-transparent">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para Planos
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {step === 'form' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 sm:p-8"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Finalizar Assinatura</h1>
                <p className="text-gray-500 mt-1">Preencha seus dados para concluir a contratação.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Data */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Dados Pessoais
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Nome Completo"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        readOnly={!!profileData?.fullName}
                        className={profileData?.fullName ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                        required
                      />
                      {profileData?.fullName && (
                        <p className="text-xs text-gray-400 mt-1">Carregado do seu perfil</p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="CPF / CNPJ"
                        name="document"
                        value={formData.document}
                        onChange={handleInputChange}
                        readOnly={!!profileData?.document}
                        className={profileData?.document ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                        required
                      />
                    </div>

                    <div>
                      <Input
                        label="Data de Nascimento"
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        readOnly={!!profileData?.birthDate}
                        className={profileData?.birthDate ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="País de Residência"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Pagamento Seguro via Stripe</p>
                    <p className="text-xs text-indigo-700 mt-1">
                      Você será redirecionado para a página segura do Stripe para concluir o pagamento.
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={processing}>
                  {processing ? 'Redirecionando...' : `Ir para Pagamento (R$ ${selectedPlan.price.toFixed(2)})`}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-12 text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Assinatura Confirmada!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Parabéns! Agora você é assinante do {selectedPlan.name}.
                <br />
                Todos os recursos já estão liberados na sua conta.
              </p>
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Ir para o Dashboard
              </Button>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
            
            <div className="flex items-start justify-between py-4 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{selectedPlan.name}</p>
                <p className="text-sm text-gray-500">Assinatura Mensal</p>
              </div>
              <p className="font-semibold text-gray-900">R$ {selectedPlan.price.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between py-4">
              <p className="text-lg font-bold text-gray-900">Total</p>
              <p className="text-2xl font-bold text-indigo-600">R$ {selectedPlan.price.toFixed(2)}</p>
            </div>

            <div className="mt-6 bg-indigo-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900">Garantia de 7 dias</p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Se não ficar satisfeito, devolvemos seu dinheiro sem burocracia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
