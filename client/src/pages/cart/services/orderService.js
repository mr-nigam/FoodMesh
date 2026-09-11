import axios from "axios";
import { orderService } from "../../../config/constants";
import getAuthHeader from "../../../config/getAuthHeader.js";

const getErrorMessage = (error, fallbackMessage) => {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.response?.data?.error ||
            fallbackMessage
        );
    }
    return error?.message || fallbackMessage;
};

const createSingleOrder = async (payload) => {
    try {
        const response = await axios.post(
            orderService,
            payload,
            {
                headers: getAuthHeader()
            }
        );
        return response;
    } catch (error) {
        const message = getErrorMessage(
            error,
            "Unable to create your order. Please try again."
        );
        console.error("Error creating single order:", error);
        throw new Error(message, { cause: error });
    }
};

const createAllOrders = async (payload) => {
    try {
        const response = await axios.post(
            orderService,
            payload,
            {
                headers: getAuthHeader()
            }
        );
        return response;
    } catch (error) {
        const message = getErrorMessage(
            error,
            "Unable to create your orders. Please try again."
        );
        console.error("Error creating all orders:", error);
        throw new Error(message, { cause: error });
    }
};

const orderApi = {
    createSingle: createSingleOrder,
    createAll: createAllOrders,
};

export {
    createSingleOrder,
    createAllOrders,
    orderApi
};

export default orderApi;