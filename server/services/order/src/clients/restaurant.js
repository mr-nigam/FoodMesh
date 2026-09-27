import axios from 'axios';


const RESTAURANT_SERVICE = 
    process.env.RESTAURANT_SERVICE_URL ??
    "http://localhost:4001/api/v1/restaurant";

const ORDER_SERVICE_KEY = process.env.ORDER_SERVICE_KEY;


const getRestaurantData = async({
    restaurantId
})=>{

    try{
        const { data } = await axios.get(
            `${RESTAURANT_SERVICE}/internal/${restaurantId}`,
            {
                headers: {
                    "x-service-name": "order-service",
                    "x-service-key": ORDER_SERVICE_KEY
                }
            }
        );

        const restaurant = 
            data?.data?.restaurant ??
            data?.restaurant ??
            data ??
            null;

        return restaurant;

    }catch(error){
        console.log("Failed to fetch restaurant data: ", error);
        throw new Error;
    }
};


export {
    getRestaurantData
};