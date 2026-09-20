import { ApiError } from '@foodmesh/utils';
import { 
    fetchOrderForPaymentRepo,
    getOrdersForStatusUpdate,
    updateOrderStatusRepo
} from '../repositories/internal.js';

import {
    getOverallOrderStatus
} from './getOrderStatus.js';


const fetchOrderForPaymentService = async ({
    userId,
    orderId
}) => {
    if (!orderId || !userId) {
        throw new ApiError(400, "User ID and Order ID are required");
    }

    const order = await fetchOrderForPaymentRepo({
        orderId,
        userId
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
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

export {
    fetchOrderForPaymentService,
    updateOrderStatusService
};
