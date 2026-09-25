import {
    appointRiderService
} from '../../services/appointRiderService.js';


const appointRider = async({
    payload
})=>{

    const data = payload?.eventData ?? payload;

    const {
        orderId,
        restaurantOrderId,
        userId,
        restaurantId
    } = data;
    
    const rider = await appointRiderService({
        orderId,
        restaurantOrderId,
        userId,
        restaurantId
    });

    return rider;
};


export {
    appointRider   
};