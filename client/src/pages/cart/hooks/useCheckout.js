import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import useAppData from "../../../context/useAppData";
import orderApi from "../services/orderApi";
import { buildAddressPayload } from "../utils/addressMapper";
import { getValidRestaurants } from "../utils/cartValidation";
import { getApiErrorMessage } from "../utils/error";

const getOrderFromResponse = (data) => {
    return (
        data?.data?.orderDetails ??
        data?.orderDetails ??
        data?.data?.order ??
        data?.order ??
        null
    );
};

const useCheckout = ({ selectedAddress, onRequireAddress }) => {
    const navigate = useNavigate();
    const { cart = [], refreshCart } = useAppData();

    const [checkingOutRestaurantId, setCheckingOutRestaurantId] =
        useState(null);
    const [isCheckingOutAll, setIsCheckingOutAll] =
        useState(false);

    const ensureAddress = () => {
        if (!selectedAddress) {
            toast.error(
                "Please select a delivery address to proceed to checkout."
            );
            if (typeof onRequireAddress === "function") {
                onRequireAddress();
            }
            return false;
        }

        try {
            buildAddressPayload(selectedAddress);
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const navigateToPayment = (order) => {
        const orderId = order?.id ?? order?.order_id ?? order?._id;

        if (!orderId) {
            throw new Error(
                "Order was created but the response did not contain an order ID."
            );
        }

        navigate(`/checkout/${orderId}`, {
            state: { order },
        });
    };

    const refreshCartAfterSuccessfulOrder = async () => {
        try {
            await refreshCart();
        } catch (error) {
            console.error(
                "Cart refresh failed after successful order:",
                error
            );
        }
    };

    const checkoutSingle = async (restaurantCart) => {
        const restaurantId =
            restaurantCart?.restaurant?.id ??
            restaurantCart?.restaurant?._id;

        if (!restaurantId) {
            toast.error("Restaurant information is missing.");
            return;
        }

        if (checkingOutRestaurantId || isCheckingOutAll) {
            return;
        }

        if (!ensureAddress()) {
            return;
        }

        const validRestaurants =
            getValidRestaurants([restaurantCart]);

        if (!validRestaurants.length) {
            toast.error(
                "This restaurant is closed or contains unavailable items."
            );
            return;
        }

        setCheckingOutRestaurantId(restaurantId);

        try {
            const addressPayload = buildAddressPayload(selectedAddress);
            const payload = {
                restaurantId,
                orderType: "checkoutSingle",
                ...addressPayload,
            };

            const response = await orderApi.createSingle(payload);
            const order = getOrderFromResponse(response?.data);

            if (!order) {
                throw new Error(
                    "Order creation returned an invalid response."
                );
            }

            toast.success(
                "Order created! Redirecting to payment..."
            );

            await refreshCartAfterSuccessfulOrder();

            navigateToPayment(order);
        } catch (error) {
            console.error(
                "Single restaurant checkout failed:",
                error
            );

            toast.error(
                getApiErrorMessage(
                    error,
                    "Failed to place order"
                )
            );
        } finally {
            setCheckingOutRestaurantId(null);
        }
    };

    const checkoutAll = async () => {
        if (checkingOutRestaurantId || isCheckingOutAll) {
            return;
        }

        if (!ensureAddress()) {
            return;
        }

        const validRestaurants =
            getValidRestaurants(cart);

        if (!validRestaurants.length) {
            toast.error(
                "No open or available restaurants to checkout right now."
            );
            return;
        }

        setIsCheckingOutAll(true);

        try {
            const addressPayload = buildAddressPayload(selectedAddress);
            const payload = {
                paymentMethod: "online",
                orderType: "checkoutAll",
                ...addressPayload,
            };

            const response = await orderApi.createAll(payload);
            const order = getOrderFromResponse(response?.data);

            if (!order) {
                throw new Error(
                    "Order creation returned an invalid response."
                );
            }

            toast.success(
                "Orders created! Redirecting to payment..."
            );

            await refreshCartAfterSuccessfulOrder();

            navigateToPayment(order);
        } catch (error) {
            console.error(
                "Checkout all failed:",
                error
            );

            toast.error(
                getApiErrorMessage(
                    error,
                    "Failed to place order"
                )
            );
        } finally {
            setIsCheckingOutAll(false);
        }
    };

    return {
        checkingOutRestaurantId,
        isCheckingOutAll,
        checkoutSingle,
        checkoutAll,
    };
};

export default useCheckout;