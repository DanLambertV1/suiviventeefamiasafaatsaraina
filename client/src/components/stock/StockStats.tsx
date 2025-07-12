import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart,
  BarChart3
} from 'lucide-react';

interface StockStatsProps {
  totalProducts: number;
  totalStock: number;
  totalSold: number;
  outOfStock: number;
  lowStock: number;
  totalRevenue: number;
  loading: boolean;
}

export function StockStats({
  totalProducts,
  totalStock,
  totalSold,
  outOfStock,
  lowStock,
  totalRevenue,
  loading
}: StockStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div 
            key={index}
            className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4 animate-pulse"
          >
            <div className="h-10 w-10 bg-gray-700 rounded-lg mb-3"></div>
            <div className="h-6 w-24 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-16 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Produits</p>
            <p className="text-2xl font-bold text-white">{totalProducts}</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Package className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Stock Total</p>
            <p className="text-2xl font-bold text-white">{totalStock}</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Vendus</p>
            <p className="text-2xl font-bold text-white">{totalSold}</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Rupture</p>
            <p className="text-2xl font-bold text-white">{outOfStock}</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Stock Faible</p>
            <p className="text-2xl font-bold text-white">{lowStock}</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-xl p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">CA Potentiel</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}