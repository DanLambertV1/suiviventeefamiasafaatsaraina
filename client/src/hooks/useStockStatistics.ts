import { useMemo } from 'react';
import { Product } from '../types';

export function useStockStatistics(products: Product[], filteredProducts: Product[]) {
  return useMemo(() => {
    // Calculate statistics based on filtered products
    const totalProducts = filteredProducts.length;
    const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
    const totalSold = filteredProducts.reduce((sum, product) => sum + (product.quantitySold || 0), 0);
    const outOfStock = filteredProducts.filter(product => product.stock === 0).length;
    const lowStock = filteredProducts.filter(product => product.stock > 0 && product.stock <= product.minStock).length;
    const totalRevenue = filteredProducts.reduce((sum, product) => {
      const sold = product.quantitySold || 0;
      return sum + (sold * product.price);
    }, 0);

    // Calculate category breakdown
    const categories = [...new Set(filteredProducts.map(product => product.category))];
    const categoryCounts = categories.map(category => {
      const productsInCategory = filteredProducts.filter(product => product.category === category);
      return {
        category,
        count: productsInCategory.length,
        stock: productsInCategory.reduce((sum, product) => sum + product.stock, 0),
        sold: productsInCategory.reduce((sum, product) => sum + (product.quantitySold || 0), 0),
        revenue: productsInCategory.reduce((sum, product) => {
          const sold = product.quantitySold || 0;
          return sum + (sold * product.price);
        }, 0)
      };
    }).sort((a, b) => b.count - a.count);

    // Calculate stock level breakdown
    const stockLevels = {
      outOfStock: outOfStock,
      lowStock: lowStock,
      healthy: totalProducts - outOfStock - lowStock
    };

    return {
      totalProducts,
      totalStock,
      totalSold,
      outOfStock,
      lowStock,
      totalRevenue,
      categoryCounts,
      stockLevels
    };
  }, [products, filteredProducts]);
}