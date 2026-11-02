import axios from 'axios';
import getAuthHeader from '../../../config/getAuthHeader.js';

import { 
    apiBaseUrl 
} from '../../../config/constants.js';


const addAddress = async ({
    payload
})=>{
    await axios.post(
        `${apiBaseUrl}/user/address/add`,
        payload,
        getAuthHeader()
    );
};

const getAddresses = async()=>{

    const { data } = await axios.get(
        `${apiBaseUrl}/user/address/all`,
        getAuthHeader()  
    );
    
    return data?.data?.addresses || data?.addresses || []; 
};

const delAddress = async({
    id
})=>{
    await axios.delete(
        `${apiBaseUrl}/user/address/${id}`,
        getAuthHeader()
    ); 
};

const getOrders = async()=>{
    const { data } = await axios.get(
        `${apiBaseUrl}/order`,
        getAuthHeader()
    );

    return data?.data?.orders ??  data?.orders ?? [];
};

const getOrder = async({
    orderId
})=>{

    const { data } = await axios.get(
        `${apiBaseUrl}/order/${orderId}`,
        getAuthHeader()
    );

    return data?.data?.order ?? data?.order ?? null;
};

const cancelOrder = async({
    orderId
})=>{

    await axios.patch(
        `${apiBaseUrl}/order/${orderId}`,
        {},
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
