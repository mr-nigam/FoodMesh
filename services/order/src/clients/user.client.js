import axios from 'axios';


const USER_SERVICE = process.env.USER_SERVICE_URL;
const RESTAURANT_SERVICE = process.env.RESTAURANT_SERVICE;
const ORDER_SERVICE_KEY = process.env.ORDER_SERVICE_KEY;

const getAddress = async ({
    userId,
    addressId
}) =>{

    const { data } = await axios.get(
        `${USER_SERVICE}/internal/users/${userId}/addresses/${addressId}`,
        {
            headers: {
                "x-service-name": "order-service",
                "x-service-key": ORDER_SERVICE_KEY
            }
        }
    );

    const address = 
        data?.data?.address ??
        data?.address ??
        null;

    return address;
};

const getCartData = async({
    userId,
    restaurantId,
    targetRestId,
    requestType
}) => {
    const restId = restaurantId || targetRestId || null;
    const reqType = requestType || (restId ? "single" : "all");
    
    const restaurantPath = restId
        ? `/restaurant/${restId}`
        : "";

    const { data } = await axios.get(
        `${RESTAURANT_SERVICE}/internal/users/${userId}/${reqType}${restaurantPath}`,
        {
            headers: {
                "x-service-name": "order-service",
                "x-service-key": ORDER_SERVICE_KEY
            }   
        }
    );

    const cartData = 
        data?.data?.restaurants ??
        data?.restaurants ??
        null;

    return cartData;
};

const deleteCartData = async({
    userId,
    restaurantId = null,
    targetRestId = null,
    requestType
}) =>{
    const restId = restaurantId || targetRestId || null;
    const reqType = requestType || (restId ? "single" : "all");
    
    const restaurantPath = restId
        ? `/restaurant/${restId}`
        : "";

    const { data } = await axios.delete(
        `${RESTAURANT_SERVICE}/internal/users/${userId}/${reqType}${restaurantPath}`,
        {
            headers: {
                "x-service-name": "order-service",
                "x-service-key": ORDER_SERVICE_KEY
            }   
        }
    );

    const deletedData = 
        data?.data ??
        data ??
        null;

    return deletedData;
};


export {
    getAddress,
    getCartData,
    deleteCartData
};