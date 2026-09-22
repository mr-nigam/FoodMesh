
import {
    findAndAppointDeliveryRider
} from '../../services/internal.js';

const delievryHandler = async(payload)=>{

    const data = payload?.eventData ?? payload;

    const {
        orderId,
        restaurantOrderId,
        userId,
        restaurantId
    } = data;


};

export {
    delievryHandler   
};