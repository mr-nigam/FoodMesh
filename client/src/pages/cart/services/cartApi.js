import axios from "axios";
import { restaurantService } from "../../../config/constants";
import getAuthHeader from "../../../config/getAuthHeader.js";

const removeCartItem = async (itemId) => {
    try {
        const { data } = await axios.delete(
            `${restaurantService}/cart/remove/${itemId}`,
            {
                headers: getAuthHeader()
            }
        );
        return { data };
    } catch (error) {
        console.error("Error removing cart item:", error);
        throw error;
    }
};

const removeRestaurantFromCart = async (restaurantId) => {
    try {
        const { data } = await axios.delete(
            `${restaurantService}/cart/remove/r/${restaurantId}`,
            {
                headers: getAuthHeader()
            }
        );
        return { data };
    } catch (error) {
        console.error("Error removing restaurant from cart:", error);
        throw error;
    }
};

const clearCart = async () => {
    try {
        const { data } = await axios.delete(
            `${restaurantService}/cart/clear`,
            {
                headers: getAuthHeader()
            }
        );
        return { data };
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw error;
    }
};

const cartApi = {
    removeItem: removeCartItem,
    removeRestaurant: removeRestaurantFromCart,
    clear: clearCart
};

export {
    removeCartItem,
    removeRestaurantFromCart,
    clearCart,
    cartApi
};

export default cartApi;