import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, push, set, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, Copy, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface Product {
  id: string;
  name: string;
  price: number;
  promotionalPrice?: number;
}

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [pixCode, setPixCode] = useState('');
  const [orderId, setOrderId] = useState('');

  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    cpf: '',
  });

  useEffect(() => {
    if (!id) return;
    const productRef = ref(db, `products/${id}`);
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProduct({ id, ...data });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !currentUser) return;

    const newOrderRef = push(ref(db, 'orders'));
    const newOrderId = newOrderRef.key;
    const price = product.promotionalPrice || product.price;
    
    // Mock Pix Code generation
    const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(7)}520400005303986540${price.toFixed(2).replace('.', '')}5802BR5913Loja Virtual6008Brasilia62070503***6304`;
    
    await set(newOrderRef, {
      userId: currentUser.uid,
      productId: product.id,
      productName: product.name,
      amount: price,
      status: 'pending',
      customer: formData,
      createdAt: Date.now(),
      pixCode: mockPixCode
    });

    setOrderId(newOrderId!);
    setPixCode(mockPixCode);
    setStep('payment');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    alert('Código Pix copiado!');
  };

  const handleSimulatePayment = async () => {
    if (!orderId) return;
    // Simulate backend webhook updating the order
    await set(ref(db, `orders/${orderId}/status`), 'paid');
    setStep('success');
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!product) return <div className="text-center p-12">Produto não encontrado</div>;

  const finalPrice = product.promotionalPrice || product.price;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 pl-0 hover:bg-transparent">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar
      </Button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold flex items-center">
            <Wallet className="w-6 h-6 mr-3" />
            Checkout Seguro
          </h1>
        </div>

        <div className="p-8">
          {step === 'form' && (
            <motion.form 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onSubmit={handleGeneratePix}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-xl mb-8 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">Item digital</p>
                </div>
                <div className="text-xl font-bold text-indigo-600">
                  R$ {finalPrice.toFixed(2)}
                </div>
              </div>

              <div className="grid gap-6">
                <Input
                  label="Nome Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <Input
                  label="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full mt-8">
                <QrCode className="w-5 h-5 mr-2" />
                Gerar Pix para Pagamento
              </Button>
            </motion.form>
          )}

          {step === 'payment' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-center space-y-8"
            >
              <div className="bg-green-50 text-green-800 p-4 rounded-xl inline-block">
                <p className="font-medium">Pedido #{orderId.slice(-6)} criado com sucesso!</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Escaneie o QR Code</h3>
                <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl inline-block">
                  {/* Mock QR Code - In real app, generate from pixCode */}
                  <div className="w-48 h-48 bg-gray-900 flex items-center justify-center text-white text-xs">
                    [QR CODE PIX]
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ou copie o código Pix:</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixCode} 
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 truncate"
                  />
                  <Button type="button" variant="secondary" onClick={handleCopyPix}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4">Após o pagamento, a liberação é automática.</p>
                <Button onClick={handleSimulatePayment} className="w-full bg-green-600 hover:bg-green-700">
                  Simular Pagamento (Demo)
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Confirmado!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Seu pedido foi processado com sucesso. Você receberá os detalhes por email.
              </p>
              <Button size="lg" onClick={() => navigate('/store')}>
                Voltar para a Loja
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm flex justify-center items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Ambiente seguro e criptografado
      </div>
    </div>
  );
}
