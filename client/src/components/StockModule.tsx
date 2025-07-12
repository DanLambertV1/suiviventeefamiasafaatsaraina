import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  X,
  Zap
} from 'lucide-react';
import { Product } from '../types';
import { exportToExcel } from '../utils/excelUtils';
import { useViewState, useScrollPosition } from '../hooks/useViewState';
import { StockFilters } from './stock/StockFilters';
import { StockStats } from './stock/StockStats';
import { StockTable } from './stock/StockTable';
import { useFilteredProducts } from '../hooks/useFilteredProducts';
import { useStockStatistics } from '../hooks/useStockStatistics';
import { StockImportModule } from './StockImportModule';
import { ProductEditModal } from './stock/ProductEditModal';
import { calculateStockFinal } from '../utils/calculateStockFinal';

interface StockModuleProps {
  products: Product[];
  registerSales: any[];
  loading: boolean;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onAddProducts: (products: Omit<Product, 'id'>[]) => Promise<boolean>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onDeleteProducts: (productIds: string[]) => Promise<boolean>;
  onRefreshData: () => void;
  autoSyncProductsFromSales: () => Promise<{
    created: Product[];
    summary: string;
  }>;
}

export default function StockModule({
  products,
  registerSales,
  loading,
  onAddProduct,
  onAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteProducts,
  onRefreshData,
  autoSyncProductsFromSales
}: StockModuleProps) {
  const { viewState, updateState, updateFilters, resetState } = useViewState('stock');
  useScrollPosition('stock');

  // Initialize state from viewState with stable defaults
  const [searchTerm, setSearchTerm] = useState(viewState.searchTerm || '');
  const [filterCategory, setFilterCategory] = useState(viewState.filters?.category || 'all');
  const [filterStockLevel, setFilterStockLevel] = useState(viewState.filters?.stockLevel || 'all');
  const [filterStatus, setFilterStatus] = useState(viewState.filters?.status || 'all');
  const [sortField, setSortField] = useState<keyof Product>(viewState.sortField as keyof Product || 'name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(viewState.sortDirection || 'asc');
  const [dateRange, setDateRange] = useState(viewState.dateRange || { start: '', end: '' });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(viewState.selectedItems || new Set());
  const [currentPage, setCurrentPage] = useState(viewState.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(viewState.itemsPerPage || 25);
  const [activeTab, setActiveTab] = useState(viewState.activeTab || 'list');
  const [showDeleteModal, setShowDeleteModal] = useState(viewState.modals?.deleteModal || false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    summary?: string;
  } | null>(null);

  // Use custom hooks for filtering and statistics
  const { filteredProducts, sortedProducts, paginatedProducts, totalPages } = useFilteredProducts({
    products,
    searchTerm,
    filterCategory,
    filterStockLevel,
    filterStatus,
    dateRange,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage
  });

  const stats = useStockStatistics(products, filteredProducts);

  // Debounced state updates to prevent excessive re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateState({
        searchTerm,
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        activeTab,
        scrollPosition: viewState.scrollPosition
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage, itemsPerPage, sortField, sortDirection, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ category: filterCategory, stockLevel: filterStockLevel, status: filterStatus });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [filterCategory, filterStockLevel, filterStatus]);

  // Extract unique categories
  const categories = [...new Set(products.map(p => p.category))];

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const exportData = sortedProducts.map(product => ({
      Nom: product.name,
      Catégorie: product.category,
      Prix: product.price,
      Stock: product.stock,
      'Stock Minimum': product.minStock,
      'Quantité Vendue': product.quantitySold || 0,
      Description: product.description || ''
    }));
    
    exportToExcel(exportData, `stock-${new Date().toISOString().split('T')[0]}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStockLevel('all');
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Selection handlers
  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(product => product.id)));
    }
  };

  const selectAllFiltered = () => {
    setSelectedProducts(new Set(sortedProducts.map(product => product.id)));
  };

  // Edit product handler
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsCreatingProduct(false);
    setShowEditModal(true);
  };
  
  // Create new product handler
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsCreatingProduct(true);
    setShowEditModal(true);
  };
  
  // Save product handler
  const handleSaveProduct = async (productData: Product | Omit<Product, 'id'>) => {
    try {
      if ('id' in productData) {
        // Update existing product
        await onUpdateProduct(productData.id, productData);
      } else {
        // Create new product
        await onAddProduct(productData);
      }
      
      setShowEditModal(false);
      setEditingProduct(null);
      setIsCreatingProduct(false);
      onRefreshData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // Delete product handler
  const handleDeleteProduct = (productId: string) => {
    setSelectedProducts(new Set([productId]));
    setShowDeleteModal(true);
  };

  // Batch delete handler
  const handleBatchDelete = () => {
    if (selectedProducts.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedProducts.size === 0) return;

    setIsDeleting(true);
    try {
      if (selectedProducts.size === 1) {
        const productId = Array.from(selectedProducts)[0];
        await onDeleteProduct(productId);
      } else {
        await onDeleteProducts(Array.from(selectedProducts));
      }
      
      setSelectedProducts(new Set());
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting products:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await autoSyncProductsFromSales();
      
      setSyncResult({
        success: true,
        message: `${result.created.length} produits créés avec succès`,
        summary: result.summary
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la synchronisation'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterStockLevel !== 'all' || 
                          filterStatus !== 'all' || dateRange.start || dateRange.end;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Stock</h1>
          <p className="text-gray-400">Gérez votre inventaire et suivez les niveaux de stock</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCreateProduct}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter</span>
          </button>
          
          <button
            onClick={onRefreshData}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Actualiser</span>
          </button>
          
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'list'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <span>Liste des Produits</span>
        </button>
        
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'import'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <span>Import Stock</span>
        </button>
      </div>

      {/* Actions de sélection multiple */}
      {activeTab === 'list' && selectedProducts.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl 
                     border border-blue-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">
                {selectedProducts.size} produit(s) sélectionné(s)
              </span>
              {selectedProducts.size < filteredProducts.length && (
                <button
                  onClick={selectAllFiltered}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Sélectionner tous les produits filtrés ({filteredProducts.length})
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleBatchDelete}
                className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 
                           transition-all duration-200 flex items-center space-x-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
              
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-500/30 
                           transition-all duration-200 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stock Statistics */}
            <StockStats
              totalProducts={stats.totalProducts}
              totalStock={stats.totalStock}
              totalSold={stats.totalSold}
              outOfStock={stats.outOfStock}
              lowStock={stats.lowStock}
              totalRevenue={stats.totalRevenue}
              loading={loading}
            />

            {/* Auto-sync button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl 
                         border border-purple-500/30 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Synchronisation Automatique</h3>
                    <p className="text-gray-400 text-sm">Créez automatiquement des produits à partir des données de vente</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold 
                             py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 
                             transition-all duration-200 flex items-center space-x-2"
                >
                  <Zap className="w-5 h-5" />
                  <span>Synchroniser</span>
                </button>
              </div>
            </motion.div>

            {/* Filters */}
            <StockFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              filterStockLevel={filterStockLevel}
              setFilterStockLevel={setFilterStockLevel}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              dateRange={dateRange}
              setDateRange={setDateRange}
              categories={categories}
              hasActiveFilters={hasActiveFilters}
              clearAllFilters={clearFilters}
            />

            {/* Products Table */}
            <StockTable
              paginatedProducts={paginatedProducts}
              sortField={sortField}
              sortDirection={sortDirection}
              handleSort={handleSort}
              selectedProducts={selectedProducts}
              toggleSelectProduct={toggleSelectProduct}
              toggleSelectAll={toggleSelectAll}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              itemsPerPage={itemsPerPage}
              handleItemsPerPageChange={handleItemsPerPageChange}
              totalFilteredProducts={filteredProducts.length}
              registerSales={registerSales}
            />
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StockImportModule
              products={products}
              onUpdateProduct={onUpdateProduct}
              onAddProduct={onAddProduct}
              onRefreshData={onRefreshData}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Product Edit Modal */}
      {showEditModal && (
        <ProductEditModal
          product={editingProduct}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
            setIsCreatingProduct(false);
          }}
          onSave={handleSaveProduct}
          isLoading={false}
          isNewProduct={isCreatingProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
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
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Confirmer la suppression</h3>
                  <p className="text-gray-400 text-sm">Cette action est irréversible</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <h4 className="text-red-400 font-semibold mb-2">Données à supprimer :</h4>
                <div className="text-gray-300 text-sm space-y-1">
                  <div>• <strong>{selectedProducts.size}</strong> produit(s) sélectionné(s)</div>
                  <div>• Toutes les données associées seront perdues</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold 
                             py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmer la suppression</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl 
                             hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Sync Confirmation Modal */}
      <AnimatePresence>
        {showSyncModal && (
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
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl"
            >
              {!syncResult ? (
                <>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Synchronisation Automatique</h3>
                      <p className="text-gray-400 text-sm">Créer des produits à partir des données de vente</p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                    <h4 className="text-blue-400 font-semibold mb-2">Comment ça fonctionne :</h4>
                    <div className="text-gray-300 text-sm space-y-1">
                      <div>• Analyse toutes les ventes pour trouver des produits manquants</div>
                      <div>• Crée automatiquement les produits qui n'existent pas dans le stock</div>
                      <div>• Calcule les prix moyens et les quantités vendues</div>
                      <div>• Génère un rapport détaillé des actions effectuées</div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleAutoSync}
                      disabled={isSyncing}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold 
                                 py-3 px-4 rounded-xl hover:from-purple-600 hover:to-blue-600 
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Synchronisation...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Lancer la synchronisation</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowSyncModal(false)}
                      disabled={isSyncing}
                      className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl 
                                 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 ${syncResult.success ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center`}>
                      {syncResult.success ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <X className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {syncResult.success ? 'Synchronisation Réussie' : 'Échec de la Synchronisation'}
                      </h3>
                      <p className={`text-sm ${syncResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {syncResult.message}
                      </p>
                    </div>
                  </div>

                  {syncResult.summary && (
                    <div className="bg-gray-700/30 rounded-xl p-4 mb-6 max-h-80 overflow-y-auto">
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                        {syncResult.summary}
                      </pre>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowSyncModal(false);
                        setSyncResult(null);
                      }}
                      className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl 
                                 hover:bg-gray-500 transition-all duration-200"
                    >
                      Fermer
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}