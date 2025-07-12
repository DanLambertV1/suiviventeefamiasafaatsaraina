import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Package,
  Tag,
  AlertCircle
} from 'lucide-react';

interface StockFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterStockLevel: string;
  setFilterStockLevel: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
  categories: string[];
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
}

export function StockFilters({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterStockLevel,
  setFilterStockLevel,
  filterStatus,
  setFilterStatus,
  dateRange,
  setDateRange,
  categories,
  hasActiveFilters,
  clearAllFilters
}: StockFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Filtres</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white 
                       bg-gray-700/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4" />
            <span>Effacer les filtres</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                       placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 bg-gray-700/50 border border-gray-600 rounded-lg px-3">
            <Tag className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 bg-gray-700/50 border border-gray-600 rounded-lg px-3">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={filterStockLevel}
            onChange={(e) => setFilterStockLevel(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les niveaux de stock</option>
            <option value="out">Rupture de stock</option>
            <option value="low">Stock faible</option>
            <option value="ok">Stock suffisant</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 bg-gray-700/50 border border-gray-600 rounded-lg px-3">
            <AlertCircle className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2 bg-gray-700/50 border border-gray-600 rounded-lg px-3">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={dateRange.start && dateRange.end ? 'custom' : 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setDateRange({ start: '', end: '' });
              } else if (e.target.value === 'custom') {
                // Keep current custom range or set default
                if (!dateRange.start && !dateRange.end) {
                  const today = new Date();
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  
                  setDateRange({
                    start: thirtyDaysAgo.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                  });
                }
              }
            }}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-blue-500"
          >
            <option value="all">Toutes les dates</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </div>
      </div>
      
      {(dateRange.start || dateRange.end) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date de début</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                         focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Date de fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white
                         focus:outline-none focus:border-blue-500"
            />
          </div>
        </motion.div>
      )}
      
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
        >
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <Filter className="w-4 h-4" />
            <span>Filtres actifs</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}