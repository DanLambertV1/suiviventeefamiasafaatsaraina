import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Filter,
  Download,
  ArrowUpDown,
  Package,
  AlertTriangle,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Upload,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Monitor,
  CheckCircle,
  DollarSign,
  Save
} from 'lucide-react';
import { Product, RegisterSale } from '../types';
import { format, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { exportToExcel } from '../utils/excelUtils';
import { useViewState, useScrollPosition } from '../hooks/useViewState';
import { useLanguage } from '../contexts/LanguageContext';

interface StockModuleProps {
  products: Product[];
  registerSales: RegisterSale[];
  loading: boolean;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onAddProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
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
  const { t } = useLanguage();
  const { viewState, updateState, updateFilters, updateDateRange, updateSelectedItems, updateModals } = useViewState('stock');
  useScrollPosition('stock');

  // Initialize state from viewState with stable defaults
  const [searchTerm, setSearchTerm] = useState(viewState.searchTerm || '');
  const [filterCategory, setFilterCategory] = useState(viewState.filters?.category || 'all');
  const [filterStatus, setFilterStatus] = useState(viewState.filters?.status || 'all');
  const [filterStockLevel, setFilterStockLevel] = useState(viewState.filters?.stockLevel || 'all');
  const [filterRegister, setFilterRegister] = useState(viewState.filters?.register || 'all');
  const [filterSeller, setFilterSeller] = useState(viewState.filters?.seller || 'all');
  const [sortField, setSortField] = useState<keyof Product>(viewState.sortField as keyof Product || 'name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(viewState.sortDirection || 'asc');
  const [dateRange, setDateRange] = useState(viewState.dateRange || { start: '', end: '' });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(viewState.selectedItems || new Set());
  const [currentPage, setCurrentPage] = useState(viewState.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(viewState.itemsPerPage || 50);
  const [activeTab, setActiveTab] = useState(viewState.activeTab || 'list');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(viewState.modals?.addModal || false);
  const [showEditModal, setShowEditModal] = useState(viewState.modals?.editModal || false);
  const [showDeleteModal, setShowDeleteModal] = useState(viewState.modals?.deleteModal || false);
  const [showImportModal, setShowImportModal] = useState(viewState.modals?.importModal || false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Edit product form state
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    initialStock: '',
    minStock: '',
    description: ''
  });
  
  // Toast notification state
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

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
      updateFilters({ 
        category: filterCategory, 
        status: filterStatus, 
        stockLevel: filterStockLevel,
        register: filterRegister,
        seller: filterSeller
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [filterCategory, filterStatus, filterStockLevel, filterRegister, filterSeller]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateDateRange(dateRange);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [dateRange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSelectedItems(selectedProducts);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedProducts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateModals({ 
        addModal: showAddModal, 
        editModal: showEditModal, 
        deleteModal: showDeleteModal, 
        importModal: showImportModal 
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [showAddModal, showEditModal, showDeleteModal, showImportModal]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastNotification.show) {
      const timer = setTimeout(() => {
        setToastNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification.show]);

  // Initialize edit form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setEditForm({
        name: editingProduct.name,
        category: editingProduct.category,
        price: editingProduct.price.toString(),
        stock: editingProduct.stock.toString(),
        initialStock: (editingProduct.initialStock || 0).toString(),
        minStock: editingProduct.minStock.toString(),
        description: editingProduct.description || ''
      });
    }
  }, [editingProduct]);

  // Show toast notification function
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastNotification({ show: true, type, message });
  };

  // Get filtered sales based on register, seller, and date range
  const getFilteredSales = () => {
    let filtered = registerSales;
    
    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.date;
        let matchesDateRange = true;
        
        if (dateRange.start) {
          const startDate = startOfDay(new Date(dateRange.start));
          matchesDateRange = matchesDateRange && (isAfter(saleDate, startDate) || saleDate.getTime() === startDate.getTime());
        }
        
        if (dateRange.end) {
          const endDate = endOfDay(new Date(dateRange.end));
          matchesDateRange = matchesDateRange && (isBefore(saleDate, endDate) || saleDate.getTime() === endDate.getTime());
        }
        
        return matchesDateRange;
      });
    }
    
    // Apply register filter
    if (filterRegister !== 'all') {
      filtered = filtered.filter(sale => sale.register === filterRegister);
    }
    
    // Apply seller filter
    if (filterSeller !== 'all') {
      filtered = filtered.filter(sale => sale.seller === filterSeller);
    }
    
    return filtered;
  };

  // Calculate historical stock for products based on date filter
  const calculateHistoricalStock = (product: Product, targetDate?: Date): {
    historicalStock: number;
    quantitySoldUpToDate: number;
    isHistoricalView: boolean;
  } => {
    // If no target date specified, use current stock
    if (!targetDate) {
      return {
        historicalStock: product.stock,
        quantitySoldUpToDate: product.quantitySold || 0,
        isHistoricalView: false
      };
    }

    // Calculate what the stock would have been on the target date
    const salesUpToDate = registerSales.filter(sale => {
      const saleDate = sale.date;
      const endOfTargetDate = endOfDay(targetDate);
      
      // Include sales up to and including the target date
      return (isBefore(saleDate, endOfTargetDate) || saleDate.getTime() === endOfTargetDate.getTime()) &&
             sale.product.toLowerCase().trim() === product.name.toLowerCase().trim() &&
             sale.category.toLowerCase().trim() === product.category.toLowerCase().trim();
    });

    // Calculate quantities sold up to the target date
    const quantitySoldUpToDate = salesUpToDate.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Calculate historical stock: initial stock - sales up to date
    const initialStock = product.initialStock || product.stock + (product.quantitySold || 0);
    const historicalStock = Math.max(0, initialStock - quantitySoldUpToDate);

    return {
      historicalStock,
      quantitySoldUpToDate,
      isHistoricalView: true
    };
  };

  // Get products that have sales matching the filtered criteria
  const getProductsWithFilteredSales = () => {
    const filteredSales = getFilteredSales();
    
    if (filterRegister === 'all' && filterSeller === 'all' && !dateRange.start && !dateRange.end) {
      // No sales filters applied, return all products
      return products;
    }
    
    // Get unique product names from filtered sales
    const salesProductNames = new Set(
      filteredSales.map(sale => `${sale.product.toLowerCase().trim()}|${sale.category.toLowerCase().trim()}`)
    );
    
    // Return products that have sales matching the criteria
    return products.filter(product => {
      const productKey = `${product.name.toLowerCase().trim()}|${product.category.toLowerCase().trim()}`;
      return salesProductNames.has(productKey);
    });
  };

  // Calculate revenue for each product based on filtered sales
  const calculateProductRevenue = (product: Product, filteredSales: RegisterSale[]): number => {
    return filteredSales
      .filter(sale => 
        sale.product.toLowerCase().trim() === product.name.toLowerCase().trim() &&
        sale.category.toLowerCase().trim() === product.category.toLowerCase().trim()
      )
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  // Enhanced products with historical stock calculation
  const enhancedProducts = useMemo(() => {
    // Determine target date for historical calculation
    const targetDate = dateRange.end ? new Date(dateRange.end) : 
                      dateRange.start ? new Date(dateRange.start) : null;
    
    return products.map(product => {
      const stockInfo = calculateHistoricalStock(product, targetDate);
      
      return {
        ...product,
        displayStock: stockInfo.historicalStock,
        displayQuantitySold: stockInfo.quantitySoldUpToDate,
        isHistoricalView: stockInfo.isHistoricalView,
        originalStock: product.stock,
        originalQuantitySold: product.quantitySold || 0
      };
    });
  }, [products, dateRange, registerSales]);

  // Apply all filters including sales-based filters
  const filteredProducts = useMemo(() => {
    // Start with products that match sales filters but use enhanced products
    let filtered = enhancedProducts;
    
    // Apply sales-based filtering first
    if (filterRegister !== 'all' || filterSeller !== 'all' || dateRange.start || dateRange.end) {
      const filteredSales = getFilteredSales();
      const salesProductNames = new Set(
        filteredSales.map(sale => `${sale.product.toLowerCase().trim()}|${sale.category.toLowerCase().trim()}`)
      );
      
      filtered = filtered.filter(product => {
        const productKey = `${product.name.toLowerCase().trim()}|${product.category.toLowerCase().trim()}`;
        return salesProductNames.has(productKey);
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => product.category === filterCategory);
    }

    // Apply status filter using historical stock
    if (filterStatus !== 'all') {
      filtered = filtered.filter(product => {
        const stockToCheck = product.displayStock;
        switch (filterStatus) {
          case 'in_stock':
            return stockToCheck > product.minStock;
          case 'low_stock':
            return stockToCheck > 0 && stockToCheck <= product.minStock;
          case 'out_of_stock':
            return stockToCheck === 0;
          default:
            return true;
        }
      });
    }

    // Apply stock level filter using historical stock
    if (filterStockLevel !== 'all') {
      filtered = filtered.filter(product => {
        const stockToCheck = product.displayStock;
        switch (filterStockLevel) {
          case 'high':
            return stockToCheck > 100;
          case 'medium':
            return stockToCheck >= 10 && stockToCheck <= 100;
          case 'low':
            return stockToCheck > 0 && stockToCheck < 10;
          case 'empty':
            return stockToCheck === 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting using historical stock for stock field
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'stock') {
        aValue = a.displayStock;
        bValue = b.displayStock;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    enhancedProducts, 
    searchTerm, 
    filterCategory, 
    filterStatus, 
    filterStockLevel,
    filterRegister,
    filterSeller,
    dateRange,
    sortField, 
    sortDirection,
    registerSales
  ]);

  // Get filtered sales for revenue calculations
  const filteredSales = useMemo(() => getFilteredSales(), [registerSales, filterRegister, filterSeller, dateRange]);

  // Calculate product revenues
  const productRevenues = useMemo(() => {
    const revenues = new Map<string, number>();
    
    filteredProducts.forEach(product => {
      const revenue = calculateProductRevenue(product, filteredSales);
      revenues.set(product.id, revenue);
    });
    
    return revenues;
  }, [filteredProducts, filteredSales]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Find missing products from sales data
  const missingProducts = useMemo(() => {
    const existingProductNames = new Set(products.map(p => p.name.toLowerCase()));
    const missingItems = new Set<string>();
    
    registerSales.forEach(sale => {
      const productName = sale.product.toLowerCase();
      if (!existingProductNames.has(productName)) {
        missingItems.add(sale.product);
      }
    });
    
    return Array.from(missingItems);
  }, [products, registerSales]);

  // Get unique values for filters
  const categories = [...new Set(products.map(p => p.category))];
  const registers = [...new Set(registerSales.map(s => s.register))];
  const sellers = [...new Set(registerSales.map(s => s.seller))];

  // Calculate statistics from filtered products using historical data
  const statistics = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalStock = filteredProducts.reduce((sum, product) => sum + product.displayStock, 0);
    const totalSold = filteredProducts.reduce((sum, product) => sum + product.displayQuantitySold, 0);
    const outOfStock = filteredProducts.filter(product => product.displayStock === 0).length;
    const lowStock = filteredProducts.filter(product => 
      product.displayStock > 0 && product.displayStock <= product.minStock
    ).length;
    const totalRevenue = Array.from(productRevenues.values()).reduce((sum, revenue) => sum + revenue, 0);

    // Additional historical context
    const isHistoricalView = filteredProducts.some(p => p.isHistoricalView);
    const dateInfo = isHistoricalView ? 
      (dateRange.end ? `au ${format(new Date(dateRange.end), 'dd/MM/yyyy')}` :
       dateRange.start ? `à partir du ${format(new Date(dateRange.start), 'dd/MM/yyyy')}` : '') : '';

    return {
      totalProducts,
      totalStock,
      totalSold,
      outOfStock,
      lowStock,
      totalRevenue,
      isHistoricalView,
      dateInfo
    };
  }, [filteredProducts, productRevenues, dateRange]);

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(product => ({
      Name: product.name,
      Category: product.category,
      Price: product.price,
      Stock: product.displayStock,
      'Current Stock': product.originalStock,
      'Min Stock': product.minStock,
      'Quantity Sold': product.displayQuantitySold,
      'Total Sold': product.originalQuantitySold,
      'Revenue': productRevenues.get(product.id) || 0,
      'Historical View': product.isHistoricalView ? 'Yes' : 'No',
      Description: product.description || ''
    }));
    
    const dateStr = statistics.isHistoricalView && dateRange.end ? 
      `${format(new Date(dateRange.end), 'yyyy-MM-dd')}` : 
      format(new Date(), 'yyyy-MM-dd');
    
    exportToExcel(exportData, `stock-${dateStr}`);
  };

  // Check if any sales-based filters are active
  const hasSalesFilters = filterRegister !== 'all' || filterSeller !== 'all' || dateRange.start || dateRange.end;

  const hasActiveFilters = searchTerm || filterCategory !== 'all' || filterStatus !== 'all' || 
    filterStockLevel !== 'all' || hasSalesFilters;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterStockLevel('all');
    setFilterRegister('all');
    setFilterSeller('all');
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
    setSelectedProducts(new Set(filteredProducts.map(product => product.id)));
  };

  // Auto-sync handler
  const handleAutoSync = async () => {
    setIsSyncing(true);
    try {
      const result = await autoSyncProductsFromSales();
      
      if (result.created.length > 0) {
        showToast('success', `${result.created.length} nouveaux produits synchronisés depuis les ventes`);
      } else {
        showToast('success', 'Synchronisation terminée - Aucun nouveau produit à créer');
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
      showToast('error', 'Erreur lors de la synchronisation automatique');
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete products handler
  const handleDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    
    setIsDeleting(true);
    try {
      const success = await onDeleteProducts(Array.from(selectedProducts));
      if (success) {
        setSelectedProducts(new Set());
        setShowDeleteModal(false);
        showToast('success', `${selectedProducts.size} produit(s) supprimé(s) avec succès`);
      } else {
        showToast('error', 'Erreur lors de la suppression des produits');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'Erreur lors de la suppression des produits');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle initial stock change
  const handleInitialStockChange = async (productId: string, newInitialStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Calculate new current stock: initialStock - quantitySold
    const quantitySold = product.quantitySold || 0;
    const newCurrentStock = Math.max(0, newInitialStock - quantitySold);
    
    const updates: Partial<Product> = {
      initialStock: newInitialStock,
      stock: newCurrentStock
    };
    
    try {
      await onUpdateProduct(productId, updates);
      showToast('success', `Stock initial mis à jour: ${product.name}`);
    } catch (error) {
      console.error('Error updating initial stock:', error);
      showToast('error', 'Erreur lors de la mise à jour du stock initial');
    }
  };

  // Handle adding missing products from sales
  const handleAddMissingProducts = async () => {
    if (missingProducts.length === 0) return;
    
    setIsSyncing(true);
    try {
      const result = await autoSyncProductsFromSales();
      
      if (result.created.length > 0) {
        showToast('success', `${result.created.length} produits manquants ajoutés depuis les ventes`);
      } else {
        showToast('success', 'Synchronisation terminée - Aucun nouveau produit à créer');
      }
    } catch (error) {
      console.error('Add missing products error:', error);
      showToast('error', 'Erreur lors de l\'ajout des produits manquants');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle edit product form submission
  const handleEditProduct = async () => {
    if (!editingProduct) return;
    
    setIsUpdating(true);
    try {
      const updates: Partial<Product> = {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        price: parseFloat(editForm.price),
        initialStock: parseInt(editForm.initialStock),
        stock: parseInt(editForm.stock),
        minStock: parseInt(editForm.minStock),
        description: editForm.description.trim()
      };
      
      await onUpdateProduct(editingProduct.id, updates);
      setShowEditModal(false);
      setEditingProduct(null);
      showToast('success', 'Produit mis à jour avec succès');
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'Erreur lors de la mise à jour du produit');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border border-blue-400/30 border-t-blue-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestion du Stock</h1>
          <p className="text-slate-400">Gérez votre inventaire et suivez vos stocks en temps réel</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleAutoSync}
            disabled={isSyncing}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-purple-600 hover:to-purple-700 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center space-x-2"
          >
            {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            <span>{isSyncing ? 'Synchronisation...' : 'Synchro Ventes'}</span>
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Import Stock</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                       py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter Produit</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center space-x-3 min-w-80 ${
              toastNotification.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}>
              {toastNotification.type === 'success' ? (
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              )}
              <span className="font-medium flex-1">{toastNotification.message}</span>
              <button
                onClick={() => setToastNotification(prev => ({ ...prev, show: false }))}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historical Context Banner */}
      {statistics.isHistoricalView && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-xl 
                     border border-blue-500/20 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-blue-400 font-semibold text-lg">
                Vue historique du stock
              </h3>
              <p className="text-gray-400 text-sm">
                Affichage des données {statistics.dateInfo}. Les valeurs de stock et quantités vendues correspondent à cette période.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Statistics Cards with new Revenue card */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl 
                     border border-blue-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Package className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-slate-400 text-sm">Références</p>
              <p className="text-2xl font-bold text-white">{statistics.totalProducts}</p>
            </div>
          </div>
          <p className="text-blue-400 text-sm">Total Produits</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl 
                     border border-green-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-slate-400 text-sm">Unités</p>
              <p className="text-2xl font-bold text-white">{statistics.totalStock.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-green-400 text-sm">Stock Total</p>
        </motion.div>

        {/* New Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl 
                     border border-purple-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <DollarSign className="w-6 h-6 text-purple-400" />
            <div>
              <p className="text-slate-400 text-sm">CA Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(statistics.totalRevenue)}</p>
            </div>
          </div>
          <p className="text-purple-400 text-sm">Chiffre d'Affaires</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl 
                     border border-red-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-slate-400 text-sm">Ruptures</p>
              <p className="text-2xl font-bold text-white">{statistics.outOfStock}</p>
            </div>
          </div>
          <p className="text-red-400 text-sm">Stock 0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-xl 
                     border border-orange-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <div>
              <p className="text-slate-400 text-sm">Alertes</p>
              <p className="text-2xl font-bold text-white">{statistics.lowStock}</p>
            </div>
          </div>
          <p className="text-orange-400 text-sm">Stock Faible</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-xl 
                     border border-cyan-500/20 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <div>
              <p className="text-slate-400 text-sm">Vendus</p>
              <p className="text-2xl font-bold text-white">{statistics.totalSold.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-cyan-400 text-sm">Total Vendus</p>
        </motion.div>
      </div>

      {/* Missing Products Alert */}
      {missingProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="text-orange-400 font-semibold text-lg">
                  Produits manquants détectés
                </h3>
                <p className="text-gray-400 text-sm">
                  {missingProducts.length} produit(s) trouvé(s) dans les ventes mais absent(s) du stock
                </p>
              </div>
            </div>
            <button
              onClick={handleAddMissingProducts}
              disabled={isSyncing}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center space-x-2 font-semibold"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Ajout...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Ajouter automatiquement</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">
              <strong className="text-orange-400">Produits manquants:</strong>
            </p>
            <div className="text-sm text-gray-300">
              {missingProducts.slice(0, 10).map((product, index) => (
                <span key={index} className="inline-block bg-orange-500/20 text-orange-300 px-2 py-1 rounded mr-2 mb-2">
                  {product}
                </span>
              ))}
              {missingProducts.length > 10 && (
                <span className="text-orange-400 font-medium">
                  +{missingProducts.length - 10} autres...
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Selection Actions */}
      {selectedProducts.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl 
                     border border-blue-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5 text-blue-400" />
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
                onClick={() => setShowDeleteModal(true)}
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

      {/* Advanced Filters with Sales-based filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Filtres Avancés</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-sm text-gray-400 hover:text-white transition-colors duration-200 
                         bg-slate-700/50 hover:bg-slate-700 px-3 py-2 rounded-lg flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Effacer les filtres</span>
            </button>
          )}
        </div>
        
        {/* Search and basic filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                         placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock faible</option>
            <option value="out_of_stock">Rupture</option>
          </select>
          
          <select
            value={filterStockLevel}
            onChange={(e) => setFilterStockLevel(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous les niveaux</option>
            <option value="high">Stock élevé (&gt;100)</option>
            <option value="medium">Stock moyen (10-100)</option>
            <option value="low">Stock bas (1-9)</option>
            <option value="empty">Stock vide (0)</option>
          </select>
        </div>

        {/* Sales-based filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={filterRegister}
            onChange={(e) => setFilterRegister(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Toutes les caisses</option>
            {registers.map(register => (
              <option key={register} value={register}>{register}</option>
            ))}
          </select>
          
          <select
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
            className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Tous les vendeurs</option>
            {sellers.map(seller => (
              <option key={seller} value={seller}>{seller}</option>
            ))}
          </select>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              📅 Date de début (incluse)
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                         focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Filtre les ventes à partir de cette date
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              📅 Date de fin (incluse)
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                         focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Calcule le stock à cette date (vue historique)
            </p>
          </div>
        </div>

        {/* Filter status indicator */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <div className="flex items-center space-x-2 text-blue-400 text-sm">
              <Filter className="w-4 h-4" />
              <span>
                Filtres actifs - Affichage de {filteredProducts.length} produits sur {products.length} total
                {hasSalesFilters && (
                  <span className="ml-2 text-purple-400">
                    (Filtré par ventes: {filterRegister !== 'all' ? `Caisse ${filterRegister}` : ''} 
                    {filterSeller !== 'all' ? ` Vendeur ${filterSeller}` : ''}
                    {dateRange.start || dateRange.end ? ' Période spécifique' : ''})
                  </span>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

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
                         focus:outline-none focus:border-cyan-500"
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400 text-sm">
              {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length}
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
                          ? 'bg-cyan-500 text-white'
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">
            Liste des Produits ({filteredProducts.length} résultats)
          </h3>
          
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold 
                       py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 
                       transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

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
                  { key: 'name', label: 'Nom' },
                  { key: 'category', label: 'Catégorie' },
                  { key: 'price', label: 'Prix' },
                  { key: 'initialStock', label: 'Stock Initial' },
                  { key: 'stock', label: 'Stock Actuel' },
                  { key: 'minStock', label: 'Stock Min' },
                  { key: 'quantitySold', label: 'Vendus' },
                  { key: 'revenue', label: 'CA' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left py-4 px-4 text-gray-400 font-medium cursor-pointer hover:text-white
                               transition-colors duration-200"
                    onClick={() => key !== 'revenue' ? handleSort(key as keyof Product) : null}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      {key !== 'revenue' && <ArrowUpDown className="w-4 h-4" />}
                    </div>
                  </th>
                ))}
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors duration-200 ${
                    selectedProducts.has(product.id) ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleSelectProduct(product.id)}
                      className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {selectedProducts.has(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-gray-400 text-sm">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-green-400 font-semibold">
                    {product.price.toFixed(2)} €
                  </td>
                  <td className="py-4 px-4">
                    <input
                      type="number"
                      value={product.initialStock || 0}
                      onChange={(e) => handleInitialStockChange(product.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm
                                focus:outline-none focus:border-cyan-500 text-center"
                      min="0"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col">
                        <span className={`font-semibold ${
                          product.displayStock === 0 ? 'text-red-400' :
                          product.displayStock <= product.minStock ? 'text-orange-400' :
                          'text-white'
                        }`}>
                          {product.displayStock}
                        </span>
                        {product.isHistoricalView && product.displayStock !== product.originalStock && (
                          <span className="text-xs text-gray-400">
                            (actuel: {product.originalStock})
                          </span>
                        )}
                      </div>
                      {product.displayStock <= product.minStock && (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      )}
                      {product.isHistoricalView && (
                        <Calendar className="w-4 h-4 text-blue-400" title="Vue historique" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{product.minStock}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-cyan-400 font-medium">
                        {product.displayQuantitySold}
                      </span>
                      {product.isHistoricalView && product.displayQuantitySold !== product.originalQuantitySold && (
                        <span className="text-xs text-gray-400">
                          (total: {product.originalQuantitySold})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-purple-400 font-semibold">
                    {formatCurrency(productRevenues.get(product.id) || 0)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 
                                   transition-all duration-200"
                        title="Modifier le produit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => {
                          setSelectedProducts(new Set([product.id]));
                          setShowDeleteModal(true);
                        }}
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
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun produit trouvé</p>
              {hasActiveFilters && (
                <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Edit className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Modifier le Produit</h3>
                    <p className="text-gray-400 text-sm">ID: {editingProduct.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Nom du produit
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Stock initial
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.initialStock}
                      onChange={(e) => setEditForm({...editForm, initialStock: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Stock actuel
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.stock}
                      onChange={(e) => setEditForm({...editForm, stock: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Stock minimum
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.minStock}
                      onChange={(e) => setEditForm({...editForm, minStock: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                                focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white
                              focus:outline-none focus:border-cyan-500"
                  ></textarea>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleEditProduct}
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold 
                              py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 
                              disabled:opacity-50 disabled:cursor-not-allowed
                              transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Mise à jour...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Sauvegarder</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    disabled={isUpdating}
                    className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl 
                              hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
                              transition-all duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h4 className="text-red-400 font-semibold mb-2">Produits à supprimer :</h4>
                <div className="text-gray-300 text-sm">
                  <div>• <strong>{selectedProducts.size}</strong> produit(s) sélectionné(s)</div>
                  <div>• Les données de stock seront définitivement perdues</div>
                  <div>• L'historique des ventes sera préservé</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteProducts}
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
    </div>
  );
}