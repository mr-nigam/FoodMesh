import { useEffect, useState } from "react";

import {
    getOrder
} from '../services/checkoutService.js'


const useCheckoutOrder = ({
    orderId,
    initialOrder = null
}) => {

    const [order, setOrder] = useState(
        initialOrder
    );

    const [loading, setLoading] = useState(
        !initialOrder &&
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

                const order = await getOrder({
                    orderId
                });               

                if(cancelled) return;

                setOrder(order);

            }catch(error){
                console.error(
                    "Failed to load checkout order:",
                    error
                );

                if(cancelled) return;

                setOrder(null);

                setError(
                    error?.response?.data?.message ??
                    error?.message ??
                    "Could not load order details"
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