import axios from "axios";
import { 
    apiBaseUrl
} from "../../../config/constants";

import getAuthHeader from 
"../../../config/getAuthHeader.js";


const getDefaultAddress = async () => {
    const { data } = await axios.get(
        `${apiBaseUrl}/user/address/default`,
        getAuthHeader(),
    );
    
    return data?.address?? data?.data?.address?? null;
};

const getAllAddresses = async () => {
    const { data } = await axios.get(
        `${apiBaseUrl}/user/address/all`,
        getAuthHeader(),
    );

    return data?.addresses?? data?.data?.addresses?? null;
};

const createOrder = async ({
    payload
}) => {

    const {data} = await axios.post(
        `${apiBaseUrl}/order`,
        payload,
        getAuthHeader()
    );
        
    return (
        data?.data?.order ??
        data?.order ??
        data?.data?.orders ??
        data?.orders ??
        data?.data ??
        data ??
        null
    );
        
};

const removeCartItem = async ({
    itemId
}) => {

    const { data } = await axios.delete(
        `${apiBaseUrl}/restaurant/cart/remove/${itemId}`,
        getAuthHeader()
    );

    return data?.message ??
        data?.data?.message ??
        "Cart item removed successfully"
};

const removeRestaurantFromCart = async ({
    restaurantId
}) => {

    const { data } = await axios.delete(
        `${apiBaseUrl}/restaurant/cart/remove/r/${restaurantId}`,
        getAuthHeader()
    );

    return data?.message ??
        data?.data?.message ??
        "Restaurant items removed successfully"
};

const clearCartService = async () => {
    const { data } = await axios.delete(
        `${apiBaseUrl}/restaurant/cart/clear`,
        getAuthHeader()
    );

    return data?.message ??
        data?.data?.message ??
        "Cart cleared successfully"
};


export {
    getDefaultAddress,
    getAllAddresses,
    createOrder,
    removeCartItem,
    removeRestaurantFromCart,
    clearCartService
};