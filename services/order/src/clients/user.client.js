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

const getAllCartItems = async({
    userId
}) => {
    
    const {data} = await axios.get(
        `${RESTAURANT_SERVICE}/internal/users/${userId}`,
        {
            headers: {
                "x-service-name": "order-service",
                "x-service-key": ORDER_SERVICE_KEY
            }   
        }
    );

     const cartItens = 
        data?.data?.address ??
        data?.address ??
        null;

    return cartItems;
};

const getSingleRestaurantCartItems = async({
    userId,
    restaurantId
}) => {
    
    const {data} = await axios.get(
        `${RESTAURANT_SERVICE}/internal/users/${userId}/restaurant/${restaurantId}`,
        {
            headers: {
                "x-service-name": "order-service",
                "x-service-key": ORDER_SERVICE_KEY
            }   
        }
    );

     const cartItems = 
        data?.data?.address ??
        data?.address ??
        null;

    return cartItems;
};

export {
    getAddress,
    getAllCartItems,
    getSingleRestaurantCartItems
};