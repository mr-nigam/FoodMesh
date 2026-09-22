
import {
    setCache,
    getCache,
    deleteCache,
    deleteMultipleCache,
    cachePaginatedList,
    getPaginatedList
} from '@foodmesh/redis';

import {
    getOrderData
} from '../clients/order.js';


const findAndAppointDeliveryRider = async({
    orderId,
    restaurantOrderId,
    userId,
    restaurantId
})=>{

    const order = await getOrderData({
        orderId,
        restaurantOrderId,
        userId,
        restaurantId
    });

    if(!order){
        throw new ApiError(
            500,
            "The order is not available"
        );
    }
};


export{
    findAndAppointDeliveryRider
};