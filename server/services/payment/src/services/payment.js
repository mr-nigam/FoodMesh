import ApiError from '../utils/apiError.js';
import { fetchOrderForPaymentRepo } from '../repositories/payment.js';


const fetchOrderForPaymentService = async({
    userId,
    orderId
}) => {
    if (!userId || !orderId) {
        throw new ApiError(400, "Please provide both userId and orderId");
    }

    const payment = await fetchOrderForPaymentRepo({ userId, orderId });

    if (!payment) {
        throw new ApiError(404, "Payment record not found for this order");
    }

    return payment;
};

export {
    fetchOrderForPaymentService
};