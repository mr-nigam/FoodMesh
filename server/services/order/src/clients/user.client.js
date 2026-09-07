import axios from 'axios';


const getBaseUrl = (url, prefix) => {
    if (!url) return '';
    const cleanUrl = url.replace(/\/$/, '');
    return cleanUrl.endsWith(prefix) ? cleanUrl : `${cleanUrl}${prefix}`;
};

const USER_SERVICE = getBaseUrl(process.env.USER_SERVICE_URL, '/api/v1/user');
const RESTAURANT_SERVICE = getBaseUrl(process.env.RESTAURANT_SERVICE_URL, '/api/v1/restaurant');
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
    requestType
}) =>{
    
    const restId = restaurantId || null;
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