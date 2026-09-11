/**
 * Checks if a single restaurant's cart items can be checked out.
 * 
 * Requirements:
 * - Restaurant must be open (is_open !== false)
 * - Must have at least one item with quantity > 0
 * - All items must be available (is_available !== false)
 */
export const canCheckoutRestaurant = (restaurantCart) => {
    if (!restaurantCart) return false;

    const { restaurant = {}, items = [] } = restaurantCart;

    if (restaurant.is_open === false) {
        return false;
    }

    const activeItems = (items || []).filter(
        (item) => Number(item.quantity || 0) > 0
    );

    if (activeItems.length === 0) {
        return false;
    }

    const hasUnavailableItem = activeItems.some(
        (item) => item.is_available === false
    );

    return !hasUnavailableItem;
};

/**
 * Filters a multi-restaurant cart list down to only those that can be checked out.
 */
export const getValidRestaurants = (cart = []) => {
    if (!Array.isArray(cart)) return [];

    return cart.filter((restaurantCart) =>
        canCheckoutRestaurant(restaurantCart)
    );
};