/**
 * Fee constants in Paise (100 Paise = ₹1.00)
 */
export const FEE_CONSTANTS = {
  DELIVERY_FEE: 4500, // ₹35.00
  FREE_DELIVERY_THRESHOLD: 50000, // Free delivery on subtotal >= ₹500.00
  PACKAGING_FEE: 1000, // ₹10.00
  TAX_RATE: 0.05, // 5% GST
  PLATFORM_FEE: 600, // ₹6.00
};

/**
 * Calculates fee breakdown for a single restaurant's cart section.
 */
const calculateRestaurantFees = (restaurantCart) => {
  if (!restaurantCart || !restaurantCart.items || !Array.isArray(restaurantCart.items)) {
    return {
      subtotal: 0,
      deliveryFee: 0,
      taxes: 0,
      packagingFee: 0,
      total: 0,
      isFreeDelivery: false,
    };
  }

  const subtotal = restaurantCart.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const isFreeDelivery = subtotal >= FEE_CONSTANTS.FREE_DELIVERY_THRESHOLD;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : FEE_CONSTANTS.DELIVERY_FEE) : 0;
  const taxes = Math.round(subtotal * FEE_CONSTANTS.TAX_RATE);
  const packagingFee = subtotal > 0 ? FEE_CONSTANTS.PACKAGING_FEE : 0;
  const total = subtotal + deliveryFee + taxes + packagingFee;

  return {
    subtotal,
    deliveryFee,
    taxes,
    packagingFee,
    total,
    isFreeDelivery,
  };
};

/**
 * Calculates fee breakdown for the entire cart across all restaurants.
 */
const calculateCartFees = (cart) => {
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return {
      totalItemSubtotal: 0,
      totalDeliveryFee: 0,
      totalTaxes: 0,
      totalPackagingFee: 0,
      platformFee: 0,
      grandTotal: 0,
      restaurantCount: 0,
      totalItemCount: 0,
    };
  }

  let totalItemSubtotal = 0;
  let totalDeliveryFee = 0;
  let totalTaxes = 0;
  let totalPackagingFee = 0;
  let totalItemCount = 0;

  cart.forEach((restaurantCart) => {
    const rFees = calculateRestaurantFees(restaurantCart);
    totalItemSubtotal += rFees.subtotal;
    totalDeliveryFee += rFees.deliveryFee;
    totalTaxes += rFees.taxes;
    totalPackagingFee += rFees.packagingFee;
    totalItemCount += restaurantCart.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  });

  const platformFee = 
    totalItemSubtotal > 0 
    ? FEE_CONSTANTS.PLATFORM_FEE 
    : 0;

  const grandTotal =  
      totalItemSubtotal + 
      totalDeliveryFee + 
      totalTaxes + 
      totalPackagingFee + 
      platformFee;

  return {
    totalItemSubtotal,
    totalDeliveryFee,
    totalTaxes,
    totalPackagingFee,
    platformFee,
    grandTotal,
    restaurantCount: cart.length,
    totalItemCount,
  };
};


export {
    calculateCartFees,
    calculateRestaurantFees 
};