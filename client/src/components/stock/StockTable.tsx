import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  ChevronRight,
  Search,
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { Product } from '../../types';
import { hasEarlySales } from '../../utils/calculateStockFinal';

interface StockTableProps {
  paginatedProducts: Product[];
  sortField: keyof Product;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: keyof Product) => void;
  selectedProducts: Set<string>;
  toggleSelectProduct: (productId: string) => void;
  toggleSelectAll: () => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (productId: string) => void;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  itemsPerPage: number;
  handleItemsPerPageChange: (value: number) => void;
  totalFilteredProducts: number;
  registerSales: any[];
}

export function StockTable({
  paginatedProducts,
  sortField,
  sortDirection,
  handleSort,
  selectedProducts,
  toggleSelectProduct,
  toggleSelectAll,
  handleEditProduct,
  handleDeleteProduct,
  currentPage,
  totalPages,
  goToPage,
  itemsPerPage,
  handleItemsPerPageChange,
  totalFilteredProducts,
  registerSales
}: StockTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStockStatusClass = (product: Product) => {
    if (product.stock === 0) {
      return 'bg-red-500/20 text-red-400';
    } else if (product.stock <= product.minStock) {
      return 'bg-orange-500/20 text-orange-400';
    } else {
      return 'bg-green-500/20 text-green-400';
    }
  };

  const getStockStatusText = (product: Product) => {
    if (product.stock === 0) {
      return 'Rupture';
    } else if (product.stock <= product.minStock) {
      return 'Faible';
    } else {
      return 'OK';
    }
  };

  return (
    <>
      {/* Pagination Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm">Affichage par page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm
                         focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400 text-sm">
              {totalFilteredProducts > 0 ? 
                `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalFilteredProducts)} sur ${totalFilteredProducts}` : 
                '0 résultat'}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                {[
                  { key: 'name', label: 'Produit' },
                  { key: 'category', label: 'Catégorie' },
                  { key: 'price', label: 'Prix' },
                  { key: 'stock', label: 'Stock' },
                  { key: 'minStock', label: 'Stock Min' },
                  { key: 'quantitySold', label: 'Vendus' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white
                               transition-colors duration-200"
                    onClick={() => handleSort(key as keyof Product)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                ))}
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Statut</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors duration-200 ${
                    selectedProducts.has(product.id) ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      {selectedProducts.has(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-white font-medium">{product.name}</td>
                  <td className="py-4 px-4">
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{formatCurrency(product.price)}</td>
                  <td className="py-4 px-4 text-center text-white font-medium">
                    {product.stock}
                    {hasEarlySales(product, registerSales) && (
                      <span className="ml-2 inline-flex items-center bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Stock tardif
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-300">{product.minStock}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{product.quantitySold || 0}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusClass(product)}`}>
                      {getStockStatusText(product)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 
                                   transition-all duration-200"
                        title="Modifier le produit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 
                                   transition-all duration-200"
                        title="Supprimer le produit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {paginatedProducts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun produit trouvé avec les filtres actuels</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}