import { ApiError } from '@foodmesh/utils';
import { fetchOrderForPaymentRepo } from '../repositories/internal.js';

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

export {
    fetchOrderForPaymentService
};
