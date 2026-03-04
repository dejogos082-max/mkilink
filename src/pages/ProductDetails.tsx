import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Tag, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  imageUrl: string;
  category: string;
  features?: string[];
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const productRef = ref(db, `products/${id}`);
    const unsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProduct({ id, ...data });
      } else {
        setProduct(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Produto não encontrado</h2>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/store')}>
          Voltar para a Loja
        </Button>
      </div>
    );
  }

  const hasDiscount = product.promotionalPrice && product.promotionalPrice < product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 hover:bg-transparent hover:text-indigo-600"
        onClick={() => navigate('/store')}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Voltar para a Loja
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-square shadow-xl"
        >
          <img 
            src={product.imageUrl || 'https://via.placeholder.com/600'} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          {hasDiscount && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1 rounded-full font-bold shadow-lg">
              Promoção
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center space-y-6"
        >
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-4">
              {product.category || 'Geral'}
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{product.name}</h1>
            <div className="flex items-baseline space-x-4 mt-4">
              {hasDiscount ? (
                <>
                  <span className="text-5xl font-bold text-indigo-600">
                    R$ {product.promotionalPrice?.toFixed(2)}
                  </span>
                  <span className="text-2xl text-gray-400 line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-5xl font-bold text-gray-900">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="prose prose-indigo text-gray-600">
            <p className="text-lg leading-relaxed">{product.description}</p>
          </div>

          {product.features && product.features.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                Destaques
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-600">
                    <ShieldCheck className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <Button 
              size="lg" 
              className="w-full text-lg py-6 shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
              onClick={() => navigate(`/store/checkout/${product.id}`)}
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              Comprar Agora
            </Button>
            <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Pagamento seguro via Pix com liberação imediata
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
