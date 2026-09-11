import { useState } from "react";
import toast from "react-hot-toast";

import useAppData from "../../../context/useAppData";
import cartApi from "../services/cartApi";
import { getApiErrorMessage } from "../utils/error";

const useCartActions = () => {
    const { updateQuantity, refreshCart } = useAppData();

    const [pendingItemId, setPendingItemId] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [isClearingCart, setIsClearingCart] = useState(false);

    const updateItemQuantity = async (itemId, action) => {
        if (pendingAction || pendingItemId !== null || !itemId) {
            return;
        }

        setPendingItemId(itemId);
        setPendingAction("quantity");

        try {
            await updateQuantity(itemId, action);
        } catch (error) {
            console.error("Failed to update cart quantity:", error);
            toast.error(
                getApiErrorMessage(error, "Failed to update item quantity")
            );
        } finally {
            setPendingItemId(null);
            setPendingAction(null);
        }
    };

    const removeItem = async (itemId) => {
        if (pendingAction || pendingItemId !== null || !itemId) {
            return;
        }

        setPendingItemId(itemId);
        setPendingAction("remove-item");

        try {
            const { data } = await cartApi.removeItem(itemId);

            toast.success(
                data?.message ??
                    data?.data?.message ??
                    "Cart item removed successfully"
            );

            await refreshCartSafely();
        } catch (error) {
            console.error("Failed to remove cart item:", error);
            toast.error(
                getApiErrorMessage(error, "Failed to remove cart item")
            );
        } finally {
            setPendingItemId(null);
            setPendingAction(null);
        }
    };

    const removeRestaurant = async (restaurantId, restaurantName) => {
        if (pendingAction || isClearingCart || !restaurantId) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to remove all items from ${restaurantName}?`
        );

        if (!confirmed) return;

        setPendingAction("remove-restaurant");

        try {
            const { data } = await cartApi.removeRestaurant(restaurantId);

            toast.success(
                data?.message ??
                    data?.data?.message ??
                    "Restaurant items removed successfully"
            );

            await refreshCartSafely();
        } catch (error) {
            console.error("Failed to remove restaurant items:", error);
            toast.error(
                getApiErrorMessage(error, "Failed to remove restaurant items")
            );
        } finally {
            setPendingAction(null);
        }
    };

    const clearCart = async () => {
        if (pendingAction || isClearingCart) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to clear your entire cart?"
        );

        if (!confirmed) return;

        setIsClearingCart(true);
        setPendingAction("clear-cart");

        try {
            const { data } = await cartApi.clear();

            toast.success(
                data?.message ??
                    data?.data?.message ??
                    "Cart cleared successfully"
            );

            await refreshCartSafely();
        } catch (error) {
            console.error("Failed to clear cart:", error);
            toast.error(
                getApiErrorMessage(error, "Failed to clear cart")
            );
        } finally {
            setIsClearingCart(false);
            setPendingAction(null);
        }
    };

    const refreshCartSafely = async () => {
        try {
            await refreshCart();
        } catch (error) {
            console.error("Cart refresh failed after mutation:", error);
        }
    };

    return {
        pendingItemId,
        pendingAction,
        isClearingCart,
        updateItemQuantity,
        removeItem,
        removeRestaurant,
        clearCart,
    };
};

export default useCartActions;