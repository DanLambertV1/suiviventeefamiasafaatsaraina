import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  RefreshCw, 
  Edit, 
  Package, 
  Tag,
  DollarSign,
  AlertTriangle,
  Calendar,
  Info
} from 'lucide-react';
import { Product } from '../../types';
import { format } from 'date-fns';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
  isLoading: boolean;
  isNewProduct?: boolean;
}

export function ProductEditModal({ 
  product, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading,
  isNewProduct = false
}: ProductEditModalProps) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    initialStock: 0,
    initialStockDate: format(new Date(), 'yyyy-MM-dd'),
    minStock: 0,
    description: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        initialStock: product.initialStock || product.stock,
        initialStockDate: product.initialStockDate || format(new Date(), 'yyyy-MM-dd'),
        minStock: product.minStock,
        description: product.description || ''
      });
    } else if (isNewProduct) {
      setFormData({
        name: '',
        category: '',
        price: 0,
        stock: 0,
        initialStock: 0,
        initialStockDate: format(new Date(), 'yyyy-MM-dd'),
        minStock: 0,
        description: ''
      });
    }
    setErrors({});
    setHasChanges(false);
  }, [product, isNewProduct]);

  // Check for changes
  useEffect(() => {
    if (!product && isNewProduct) {
      setHasChanges(
        formData.name.trim() !== '' || 
        formData.category.trim() !== '' || 
        formData.price !== 0 ||
        formData.initialStock !== 0
      );
      return;
    }
    
    if (!product) return;
    
    const changed = 
      formData.name !== product.name ||
      formData.category !== product.category ||
      formData.price !== product.price ||
      formData.initialStock !== (product.initialStock || product.stock) ||
      formData.initialStockDate !== (product.initialStockDate || format(new Date(), 'yyyy-MM-dd')) ||
      formData.minStock !== product.minStock ||
      formData.description !== (product.description || '');
    
    setHasChanges(changed);
  }, [formData, product, isNewProduct]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est requise';
    }

    if (formData.price < 0) {
      newErrors.price = 'Le prix doit être positif ou zéro';
    }

    if (formData.initialStock < 0) {
      newErrors.initialStock = 'Le stock initial doit être positif ou zéro';
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'Le stock minimum doit être positif ou zéro';
    }

    if (!formData.initialStockDate) {
      newErrors.initialStockDate = 'La date de stock initial est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const productToSave = isNewProduct 
      ? formData 
      : { ...product, ...formData };

    await onSave(productToSave);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Edit className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {isNewProduct ? 'Ajouter un Produit' : 'Modifier le Produit'}
                </h3>
                {!isNewProduct && product && (
                  <p className="text-gray-400 text-sm">ID: {product.id}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Product and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Produit
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                               errors.name ? 'border-red-500' : 'border-gray-600'
                             }`}
                  placeholder="Nom du produit"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Catégorie
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                               errors.category ? 'border-red-500' : 'border-gray-600'
                             }`}
                  placeholder="Catégorie du produit"
                />
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Prix (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                               errors.price ? 'border-red-500' : 'border-gray-600'
                             }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Stock Minimum
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                               errors.minStock ? 'border-red-500' : 'border-gray-600'
                             }`}
                  placeholder="0"
                />
                {errors.minStock && (
                  <p className="text-red-400 text-sm mt-1">{errors.minStock}</p>
                )}
              </div>
            </div>

            {/* Initial Stock and Date */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3 mb-4">
                <Info className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <h4 className="text-blue-400 font-semibold">Stock Initial et Date Effective</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    Le stock initial est la quantité disponible à la date spécifiée. 
                    Seules les ventes après cette date seront déduites du stock.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Package className="w-4 h-4 inline mr-2" />
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => handleInputChange('initialStock', parseInt(e.target.value))}
                    className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                 errors.initialStock ? 'border-red-500' : 'border-gray-600'
                               }`}
                    placeholder="0"
                  />
                  {errors.initialStock && (
                    <p className="text-red-400 text-sm mt-1">{errors.initialStock}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date Effective du Stock Initial
                  </label>
                  <input
                    type="date"
                    value={formData.initialStockDate}
                    onChange={(e) => handleInputChange('initialStockDate', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                                 errors.initialStockDate ? 'border-red-500' : 'border-gray-600'
                               }`}
                  />
                  {errors.initialStockDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.initialStockDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Description du produit"
              />
            </div>

            {/* Warning about changes */}
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4"
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h5 className="text-yellow-400 font-semibold">Modifications détectées</h5>
                    <p className="text-gray-300 text-sm mt-1">
                      Les modifications apportées à ce produit affecteront les statistiques et les calculs de stock.
                      Assurez-vous que les informations sont correctes avant de sauvegarder.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-8">
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold 
                         py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isNewProduct ? 'Ajouter le produit' : 'Sauvegarder les modifications'}</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl 
                         hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}