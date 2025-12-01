/**
 * Calculates the selling price of a product after applying a discount.
 * @param {number} price - The original price of the product.
 * @param {number} discount - The discount percentage (e.g., 10 for 10%).
 * @returns {number} The calculated selling price.
 */
export function calculateSellingPrice(price, discount) {
  const validPrice = parseFloat(price);
  const validDiscount = parseFloat(discount);

  // Validate inputs
  if (isNaN(validPrice) || validPrice < 0) {
    return 0;
  }

  // If discount is invalid, negative, or > 100, treat it as 0 discount
  if (isNaN(validDiscount) || validDiscount <= 0 || validDiscount > 100) {
    return validPrice;
  }

  // Calculate Discounted Price
  // Example: Price 100, Discount 20%
  // 100 * (1 - 0.20) = 80
  return validPrice * (1 - validDiscount / 100);
}