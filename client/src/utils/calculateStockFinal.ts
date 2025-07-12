import { Product, RegisterSale } from '../types';
import { parseISO, isAfter, isBefore, isEqual } from 'date-fns';

/**
 * Calculates the final stock for a product based on its initial stock and sales after the initial stock date
 * 
 * @param product The product to calculate stock for
 * @param sales All sales that might affect the product
 * @returns The calculated final stock
 */
export function calculateStockFinal(product: Product, sales: RegisterSale[]): number {
  // If no initial stock date is set, use all sales
  if (!product.initialStockDate) {
    return product.initialStock;
  }

  // Parse the initial stock date
  const initialStockDate = parseISO(product.initialStockDate);
  
  // Filter sales for this product that occurred on or after the initial stock date
  const relevantSales = sales.filter(sale => 
    sale.product.toLowerCase().trim() === product.name.toLowerCase().trim() &&
    sale.category.toLowerCase().trim() === product.category.toLowerCase().trim() &&
    (isAfter(sale.date, initialStockDate) || isEqual(sale.date, initialStockDate))
  );
  
  // Calculate total quantity sold after initial stock date
  const totalSoldAfterInitialDate = relevantSales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  // Calculate final stock
  const finalStock = Math.max(0, product.initialStock - totalSoldAfterInitialDate);
  
  return finalStock;
}

/**
 * Checks if a product has sales before its initial stock date
 * 
 * @param product The product to check
 * @param sales All sales that might affect the product
 * @returns True if there are sales before the initial stock date
 */
export function hasEarlySales(product: Product, sales: RegisterSale[]): boolean {
  // If no initial stock date is set, return false
  if (!product.initialStockDate) {
    return false;
  }

  // Parse the initial stock date
  const initialStockDate = parseISO(product.initialStockDate);
  
  // Check if there are any sales for this product before the initial stock date
  return sales.some(sale => 
    sale.product.toLowerCase().trim() === product.name.toLowerCase().trim() &&
    sale.category.toLowerCase().trim() === product.category.toLowerCase().trim() &&
    isBefore(sale.date, initialStockDate)
  );
}

/**
 * Gets the quantity sold before the initial stock date
 * 
 * @param product The product to check
 * @param sales All sales that might affect the product
 * @returns The quantity sold before the initial stock date
 */
export function getEarlySalesQuantity(product: Product, sales: RegisterSale[]): number {
  // If no initial stock date is set, return 0
  if (!product.initialStockDate) {
    return 0;
  }

  // Parse the initial stock date
  const initialStockDate = parseISO(product.initialStockDate);
  
  // Filter sales for this product that occurred before the initial stock date
  const earlySales = sales.filter(sale => 
    sale.product.toLowerCase().trim() === product.name.toLowerCase().trim() &&
    sale.category.toLowerCase().trim() === product.category.toLowerCase().trim() &&
    isBefore(sale.date, initialStockDate)
  );
  
  // Calculate total quantity sold before initial stock date
  return earlySales.reduce((sum, sale) => sum + sale.quantity, 0);
}