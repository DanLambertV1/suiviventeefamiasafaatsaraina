import { useMemo } from 'react';
import { Product } from '../types';
import { isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

interface UseFilteredProductsProps {
  products: Product[];
  searchTerm: string;
  filterCategory: string;
  filterStockLevel: string;
  filterStatus: string;
  dateRange: { start: string; end: string };
  sortField: keyof Product;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
}

export function useFilteredProducts({
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
}: UseFilteredProductsProps) {
  // Filter products based on search term and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search term filter
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      // Stock level filter
      let matchesStockLevel = true;
      if (filterStockLevel === 'out') {
        matchesStockLevel = product.stock === 0;
      } else if (filterStockLevel === 'low') {
        matchesStockLevel = product.stock > 0 && product.stock <= product.minStock;
      } else if (filterStockLevel === 'ok') {
        matchesStockLevel = product.stock > product.minStock;
      }
      
      // Status filter (based on stock level)
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = product.stock > 0;
      } else if (filterStatus === 'inactive') {
        matchesStatus = product.stock === 0;
      }
      
      // Date range filter (if applicable and product has stockHistory)
      let matchesDateRange = true;
      if ((dateRange.start || dateRange.end) && product.stockHistory && product.stockHistory.length > 0) {
        const start = dateRange.start ? startOfDay(new Date(dateRange.start)) : null;
        const end = dateRange.end ? endOfDay(new Date(dateRange.end)) : null;
        
        // Check if any stock history entry falls within the date range
        matchesDateRange = product.stockHistory.some(entry => {
          const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
          
          if (start && end) {
            return isAfter(entryDate, start) && isBefore(entryDate, end);
          } else if (start) {
            return isAfter(entryDate, start);
          } else if (end) {
            return isBefore(entryDate, end);
          }
          return true;
        });
      }
      
      return matchesSearch && matchesCategory && matchesStockLevel && matchesStatus && matchesDateRange;
    });
  }, [
    products, 
    searchTerm, 
    filterCategory, 
    filterStockLevel, 
    filterStatus, 
    dateRange
  ]);

  // Sort filtered products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special case for sorting by stock status
      if (sortField === 'stock' as keyof Product) {
        // Calculate stock status: 0 = out of stock, 1 = low stock, 2 = ok
        const aStatus = a.stock === 0 ? 0 : a.stock <= a.minStock ? 1 : 2;
        const bStatus = b.stock === 0 ? 0 : b.stock <= b.minStock ? 1 : 2;
        
        if (sortDirection === 'asc') {
          return aStatus - bStatus;
        } else {
          return bStatus - aStatus;
        }
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredProducts, sortField, sortDirection]);

  // Paginate sorted products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedProducts.length / itemsPerPage);
  }, [sortedProducts.length, itemsPerPage]);

  return {
    filteredProducts,
    sortedProducts,
    paginatedProducts,
    totalPages
  };
}