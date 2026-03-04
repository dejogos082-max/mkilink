import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { ref, push, set, remove, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useNavigate } from 'react-router-dom';

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

export default function Store() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Admin State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    promotionalPrice: 0,
    imageUrl: '',
    category: 'Geral',
    features: []
  });
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const productList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setProducts(productList);
      } else {
        setProducts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProduct) {
        await update(ref(db, `products/${editingProduct.id}`), formData);
      } else {
        const newProductRef = push(ref(db, 'products'));
        await set(newProductRef, {
          ...formData,
          createdAt: Date.now()
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        promotionalPrice: 0,
        imageUrl: '',
        category: 'Geral',
        features: []
      });
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      await remove(ref(db, `products/${productToDelete}`));
      setProductToDelete(null);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        promotionalPrice: 0,
        imageUrl: '',
        category: 'Geral',
        features: []
      });
    }
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-8 h-8 text-indigo-600" />
                Loja Virtual
              </h1>
              <p className="text-gray-500 mt-1">Produtos digitais premium para impulsionar seus resultados</p>
            </div>
            
            {isAdmin && (
              <Button onClick={() => openModal()}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Produto
              </Button>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Tente ajustar seus filtros ou volte mais tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.promotionalPrice && product.promotionalPrice < product.price && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      PROMOÇÃO
                    </div>
                  )}
                  {isAdmin && (
                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(product); }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-700 hover:text-indigo-600 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-700 hover:text-red-600 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1" title={product.name}>
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      {product.promotionalPrice && product.promotionalPrice < product.price ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 line-through">R$ {product.price.toFixed(2)}</span>
                          <span className="text-xl font-bold text-indigo-600">R$ {product.promotionalPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">R$ {product.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/store/product/${product.id}`)}
                      className="rounded-lg"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <Input
                      label="Nome do Produto"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ex: Template Premium"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                      required
                      placeholder="Descreva o produto..."
                    />
                  </div>

                  <div>
                    <Input
                      label="Preço (R$)"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                      icon={<DollarSign className="w-4 h-4" />}
                    />
                  </div>

                  <div>
                    <Input
                      label="Preço Promocional (Opcional)"
                      type="number"
                      step="0.01"
                      value={formData.promotionalPrice || ''}
                      onChange={(e) => setFormData({ ...formData, promotionalPrice: parseFloat(e.target.value) })}
                      icon={<Tag className="w-4 h-4" />}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      label="URL da Imagem"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      icon={<ImageIcon className="w-4 h-4" />}
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      label="Categoria"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Templates, Ebooks..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Produto
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Produto</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir este produto permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setProductToDelete(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0" 
                  onClick={confirmDeleteProduct}
                >
                  Excluir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
