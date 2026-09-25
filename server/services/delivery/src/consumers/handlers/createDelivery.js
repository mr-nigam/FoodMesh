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
        restaurantOrderId
    } = data;

    if(
        !orderId || 
        !restaurantOrderId
    ){
        throw new Error(
            "Please provide order ID and restaurant order ID"
        );
    }

    const cacheKey = `delivery:order:${orderId}:restaurantOrder:${restaurantOrderId}`;

    const cachedDelivery = await getCache({
        key: cacheKey
    });

    if(cachedDelivery){
        return cachedDelivery;
    }

    const order = await getOrderData({
        orderId,
        restaurantOrderId
    });

    if(!order){
        throw new Error(
            `Failed to fetch order details for orderId=${orderId} and restaurantOrderId=${restaurantOrderId}`
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