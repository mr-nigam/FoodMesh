import axios from "axios";
import { orderService as orderBaseUrl } from "../config/constants.js";
import getAuthHeader from "../config/getAuthHeader.js";

const getAuthConfig = () => {
    return {
        headers: getAuthHeader()
    };
};

const createOrder = async (payload) => {
    const response = await axios.post(
        orderBaseUrl,
        payload,
        getAuthConfig()
    );
    return response.data;
};

const fetchOrder = async (orderId) => {
    const response = await axios.get(
        `${orderBaseUrl}/${orderId}`,
        getAuthConfig()
    );
    return response.data;
};

const fetchOrders = async () => {
    const response = await axios.get(
        orderBaseUrl,
        getAuthConfig()
    );
    return response.data;
};

export {
    createOrder,
    fetchOrder,
    fetchOrders
};

export default {
    createOrder,
    fetchOrder,
    fetchOrders
};