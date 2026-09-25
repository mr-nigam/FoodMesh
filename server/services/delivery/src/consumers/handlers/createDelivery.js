import {
    getOrderData
} from '../../clients/order.js';

import {
    getCache
} from '@foodmesh/redis';

import {
    createDeliveryService
} from '../../services/createDeliveryService.js';


const createDelivery = async ({
    payload
}) => {

    const data = payload?.eventData ?? payload;

    const {
        orderId,
        orderRestaurantId
    } = data;

    if(!orderId || !orderRestaurantId){
        throw new Error(
            "Please provide order ID and restaurant order ID"
        );
    }

    const cacheKey = `delivery:order:${orderId}:restaurantOrder:${orderRestaurantId}`;

    const cachedDelivery = await getCache({
        key: cacheKey
    });

    if(cachedDelivery){
        return cachedDelivery;
    }

    const order = await getOrderData({
        orderId,
        orderRestaurantId
    });

    if(!order){
        throw new Error(
            `Failed to fetch order details for orderId=${orderId} and restaurantOrderId=${orderRestaurantId}`
        );
    }

    const delivery = await createDeliveryService({
        order
    });

    return delivery;
};


export {
    createDelivery
};