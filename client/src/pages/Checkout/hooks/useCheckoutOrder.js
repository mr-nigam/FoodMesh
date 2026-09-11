import { useEffect, useState } from "react";
import axios from "axios";

import { orderService } from "../../../config/constants";


const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    if(!token) return {};

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Could not load order details"
    );
};

const extractOrder = (data) => {
    let raw = null;

    if (data?.data?.order !== undefined) {
        raw = data.data.order;
    } else if (data?.order !== undefined) {
        raw = data.order;
    } else if (data?.data?.orderDetails !== undefined) {
        raw = data.data.orderDetails;
    } else if (data?.orderDetails !== undefined) {
        raw = data.orderDetails;
    } else if (data?.data !== undefined) {
        raw = data.data;
    } else {
        raw = data;
    }

    if (Array.isArray(raw)) {
        if (raw.length === 0) return null;
        const first = raw[0];
        const restaurants = raw.map(r => r.restaurant).filter(Boolean);
        const items = raw.flatMap(r => r.ordered_items || r.items || []).filter(Boolean);

        return {
            ...first,
            restaurants: restaurants.length > 0 ? restaurants : first.restaurants || [],
            items: items.length > 0 ? items : first.items || []
        };
    }

    return raw;
};

const normalizeOrder = (rawOrder) => {
    if (!rawOrder) {
        return null;
    }

    const order = Array.isArray(rawOrder) ? extractOrder(rawOrder) : rawOrder;
    if (!order) {
        return null;
    }

    const id = order.id ?? order.order_id ?? order._id ?? null;

    return {
        ...order,

        id,
        order_id: order.order_id ?? id,

        subtotal:
            order.subtotal ??
            order.subtotal_amount ??
            order.subtotalAmount ??
            null,

        delivery_fee:
            order.delivery_fee ??
            order.deliveryFee ??
            null,

        tax_amount:
            order.tax_amount ??
            order.taxAmount ??
            null,

        total_amount:
            order.total_amount ??
            order.totalAmount ??
            null,

        recipient_name:
            order.recipient_name ??
            order.recipientName ??
            null,

        recipient_phone:
            order.recipient_phone ??
            order.recipientPhone ??
            null,

        delivery_address:
            order.delivery_address ??
            order.deliveryAddress ??
            null,

        restaurants: Array.isArray(order.restaurants)
            ? order.restaurants
            : order.restaurant
            ? [order.restaurant]
            : [],

        items: Array.isArray(order.items)
            ? order.items
            : Array.isArray(order.ordered_items)
            ? order.ordered_items
            : []
    };
};

const validateOrder = (order) => {

    if (!order) {
        throw new Error(
            "Order was not found"
        );
    }

    if (!order.id) {
        throw new Error(
            "Order ID is missing"
        );
    }

    if (
        order.total_amount === null ||
        order.total_amount === undefined
    ) {
        throw new Error(
            "Order total amount is missing"
        );
    }

    return order;
};

const useCheckoutOrder = ({
    orderId,
    initialOrder = null
}) => {

    const normalizedInitialOrder =
        normalizeOrder(
            Array.isArray(initialOrder)
                ? initialOrder[0] ?? null
                : initialOrder
        );

    const [order, setOrder] = useState(
        normalizedInitialOrder
    );

    const [loading, setLoading] = useState(
        !normalizedInitialOrder &&
        Boolean(orderId)
    );

    const [error, setError] = useState(
        orderId
            ? null
            : "Order ID is missing"
    );

    useEffect(() => {

        let cancelled = false;

        const loadOrder = async () => {
            if(!orderId){
                if(!cancelled){
                    setOrder(null);
                    setLoading(false);
                    setError("Order ID is missing");
                }
                return;
            }

            try{
                setLoading(true);
                setError(null);

                const { data } = await axios.get(
                    `${orderService}/${orderId}`,
                    getAuthConfig()
                );

                console.log(
                    "Checkout API response:",
                    data
                );

                const rawOrder =
                    extractOrder(data);

                console.log(
                    "Extracted order:",
                    rawOrder
                );


                const normalizedOrder =
                    normalizeOrder(rawOrder);


                console.log(
                    "Normalized checkout order:",
                    normalizedOrder
                );

                const validOrder =
                    validateOrder(normalizedOrder);

                if(cancelled){
                    return;
                }

                setOrder(validOrder);

            }catch(error){
                console.error(
                    "Failed to load checkout order:",
                    error
                );

                if(cancelled) return;

                setOrder(null);

                setError(
                    getErrorMessage(error)
                );

            }finally{
                if(!cancelled){
                    setLoading(false);
                }
            }
        };

        loadOrder();

        return () => {
            cancelled = true;
        };

    }, [orderId]);

    return {
        order,
        setOrder,
        loading,
        error
    };
};


export default useCheckoutOrder;