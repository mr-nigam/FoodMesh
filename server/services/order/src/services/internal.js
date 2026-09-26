import { 
    ApiError
} from '@foodmesh/utils';

import { 
    fetchOrderRepo,
    getOrdersForStatusUpdate,
    updateOrderStatusRepo,
    fetchRestaurantOrderRepo,
    deliveryUpdateRepo
} from '../repositories/internal.js';

import {
    getOverallOrderStatus
} from './getOrderStatus.js';


const fetchOrderService = async ({
    userId,
    orderId
}) => {
    
    if(
        !orderId || 
        !userId
    ){
        throw new ApiError(
            400,
            "User ID and Order ID are required"
        );
    }

    const order = await fetchOrderRepo({
        orderId,
        userId
    });

    if(!order){
        throw new ApiError(
            404,
            "Order not found"
        );
    }

    return order;
};

const updateOrderStatusService = async({
    orderId
})=>{
    
    if(!orderId){
        throw new ApiError(
            400,
            "please give order id for proccessing"
        );
    }

    const restaurantOrders = await getOrdersForStatusUpdate({
        orderId
    });

    const status = getOverallOrderStatus({
        restaurantOrders 
    });

    const order = await updateOrderStatusRepo({
        orderId,
        status
    });
    
    return order;
}

const fetchRestaurantOrderService = async({
    params
})=>{

    const {
        orderId,
        restaurantOrderId
    } = params;

    if(
        !orderId || 
        !restaurantOrderId
    ){
        throw new ApiError(
            400,
            "Please provide order ID and restaurant order ID"
        );
    }

    const order = await fetchRestaurantOrderRepo({
        orderId,
        restaurantOrderId
    });

    if(!order){
        throw new ApiError(
            500,
            "Restaurant Order not found"
        );
    }

    return order;
};

const deliveryUpdateService = async({
    orderId,
    restaurantOrderId,
    status
})=>{

    const restOrder = await deliveryUpdateRepo({
        orderId,
        restaurantOrderId,
        status
    });

    if(!restOrder){
        throw Error(
            "Fail to update restaurant order status"
        );
    }

    const restaurantOrders = await getOrdersForStatusUpdate({
        orderId
    });

    const orderStatus = getOverallOrderStatus({
        restaurantOrders 
    });

    await updateOrderStatusRepo({
        orderId,
        status: orderStatus
    });
    
    return restOrder;
}


export {
    fetchOrderService,
    updateOrderStatusService,
    fetchRestaurantOrderService,
    deliveryUpdateService
};