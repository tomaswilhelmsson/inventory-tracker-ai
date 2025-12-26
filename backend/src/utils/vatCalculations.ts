/**
 * VAT Calculation Utilities
 * 
 * Provides functions for converting between VAT-inclusive and VAT-exclusive amounts.
 * All calculations round to 2 decimal places for currency precision.
 */

/**
 * Calculate VAT-exclusive amount from VAT-inclusive amount
 * Formula: exclVAT = inclVAT / (1 + vatRate)
 * 
 * @param inclVAT - Amount including VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.25 for 25%)
 * @returns Amount excluding VAT, rounded to 2 decimal places
 */
export function calculateExclVAT(inclVAT: number, vatRate: number): number {
  if (vatRate < 0 || vatRate > 1) {
    throw new Error(`Invalid VAT rate: ${vatRate}. Must be between 0 and 1.`);
  }
  
  const exclVAT = inclVAT / (1 + vatRate);
  return roundToTwoDecimals(exclVAT);
}

/**
 * Calculate VAT-inclusive amount from VAT-exclusive amount
 * Formula: inclVAT = exclVAT * (1 + vatRate)
 * 
 * @param exclVAT - Amount excluding VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.25 for 25%)
 * @returns Amount including VAT, rounded to 2 decimal places
 */
export function calculateInclVAT(exclVAT: number, vatRate: number): number {
  if (vatRate < 0 || vatRate > 1) {
    throw new Error(`Invalid VAT rate: ${vatRate}. Must be between 0 and 1.`);
  }
  
  const inclVAT = exclVAT * (1 + vatRate);
  return roundToTwoDecimals(inclVAT);
}

/**
 * Calculate the VAT amount
 * Formula: vatAmount = exclVAT * vatRate
 * 
 * @param exclVAT - Amount excluding VAT
 * @param vatRate - VAT rate as decimal (e.g., 0.25 for 25%)
 * @returns VAT amount, rounded to 2 decimal places
 */
export function calculateVATAmount(exclVAT: number, vatRate: number): number {
  if (vatRate < 0 || vatRate > 1) {
    throw new Error(`Invalid VAT rate: ${vatRate}. Must be between 0 and 1.`);
  }
  
  const vatAmount = exclVAT * vatRate;
  return roundToTwoDecimals(vatAmount);
}

/**
 * Validate that invoice total matches calculated total within tolerance
 * 
 * @param items - Array of line items with quantity and unit cost
 * @param shippingCost - Total shipping cost
 * @param vatRate - VAT rate as decimal
 * @param enteredTotal - Invoice total entered by user
 * @param pricesIncludeVAT - Whether line item prices include VAT
 * @param tolerance - Acceptable difference (default $0.01)
 * @returns Object with isValid flag and calculated total
 */
export function validateInvoiceTotal(
  items: Array<{ quantity: number; unitCost: number }>,
  shippingCost: number,
  vatRate: number,
  enteredTotal: number,
  pricesIncludeVAT: boolean,
  tolerance: number = 0.01
): { isValid: boolean; calculatedTotal: number; difference: number } {
  // Calculate subtotal based on entry mode
  let subtotalExclVAT = 0;
  
  for (const item of items) {
    const itemTotal = item.quantity * item.unitCost;
    if (pricesIncludeVAT) {
      // Convert to excl VAT
      subtotalExclVAT += calculateExclVAT(itemTotal, vatRate);
    } else {
      // Already excl VAT
      subtotalExclVAT += itemTotal;
    }
  }
  
  // Add shipping (assuming shipping is part of the taxable base)
  const totalExclVAT = subtotalExclVAT + shippingCost;
  
  // Calculate total incl VAT
  const calculatedTotal = calculateInclVAT(totalExclVAT, vatRate);
  
  // Check if within tolerance
  const difference = Math.abs(calculatedTotal - enteredTotal);
  const isValid = difference <= tolerance;
  
  return {
    isValid,
    calculatedTotal: roundToTwoDecimals(calculatedTotal),
    difference: roundToTwoDecimals(difference),
  };
}

/**
 * Calculate shipping allocation for line items
 * Distributes shipping proportionally based on line item values (excl VAT)
 * 
 * @param items - Array of items with quantity and unit cost (excl VAT)
 * @param totalShipping - Total shipping cost to allocate
 * @returns Array of shipping allocations per item
 */
export function allocateShipping(
  items: Array<{ quantity: number; unitCostExclVAT: number }>,
  totalShipping: number
): number[] {
  if (totalShipping === 0) {
    return items.map(() => 0);
  }
  
  // Calculate total value (excl VAT)
  const totalValue = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitCostExclVAT);
  }, 0);
  
  if (totalValue === 0) {
    // Equal distribution if all items are zero cost
    const perItem = totalShipping / items.length;
    return items.map(() => roundToTwoDecimals(perItem));
  }
  
  // Proportional allocation
  const allocations = items.map(item => {
    const itemValue = item.quantity * item.unitCostExclVAT;
    const proportion = itemValue / totalValue;
    const allocation = totalShipping * proportion;
    return roundToTwoDecimals(allocation);
  });
  
  return allocations;
}

/**
 * Round number to 2 decimal places (currency precision)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Convert percentage to decimal rate
 * @param percentage - Percentage value (e.g., 25 for 25%)
 * @returns Decimal rate (e.g., 0.25)
 */
export function percentageToRate(percentage: number): number {
  return roundToTwoDecimals(percentage / 100);
}

/**
 * Convert decimal rate to percentage
 * @param rate - Decimal rate (e.g., 0.25)
 * @returns Percentage value (e.g., 25)
 */
export function rateToPercentage(rate: number): number {
  return roundToTwoDecimals(rate * 100);
}
