import axios from 'axios';
import getAuthHeader from '../../../config/getAuthHeader.js';
import { 
    userService,
    orderService 
} from '../../../config/constants.js';


const addAddress = async ({
    payload
})=>{

    const header = getAuthHeader();

    const config = {
        headers: {
            ...header.headers,
            'Content-Type': 'multipart/form-data'
        }
    };

    await axios.post(
        `${userService}/address/add`,
        payload,
        config
    );
};

const getAddresses = async()=>{

    const { data } = await axios.get(
        `${userService}/address/all`,
        getAuthHeader()  
    );
    
    return data?.data?.addresses || data?.addresses || []; 
};

const delAddress = async({
    id
})=>{
    await axios.delete(
        `${userService}/address/${id}`,
        getAuthHeader()
    ); 
};

const getOrders = async()=>{
    const { data } = await axios.get(
        orderService,
        getAuthHeader()
    );

    return data?.data?.orders ??  data?.orders ?? [];
};

const getOrder = async({
    orderId
})=>{

    const { data } = await axios.get(
        `${orderService}/${orderId}`,
        getAuthHeader()
    );

    return data?.data?.order ?? data?.order ?? null;
};

const cancelOrder = async({
    orderId
})=>{

    await axios.patch(
        `${orderService}/${orderId}`,
        getAuthHeader()
    );
};


export {
    addAddress,
    getAddresses,
    delAddress,
    getOrders,
    getOrder,
    cancelOrder
};