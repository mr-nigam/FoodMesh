import {
    appointRiderService
} from '../../services/appointRiderService.js';


const appointRider = async({
    payload
})=>{

    const data = payload?.eventData ?? payload;

    const {
        orderId,
        orderRestaurantId,
        userId,
        restaurantId
    } = data;
    
    const rider = await appointRiderService({
        orderId,
        orderRestaurantId,
        userId,
        restaurantId
    });

    return rider;
};


export {
    appointRider   
};