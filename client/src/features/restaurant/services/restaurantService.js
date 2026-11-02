import axios from 'axios';

import getAuthHeader from 
'../../../config/getAuthHeader.js';

import { 
    apiBaseUrl
} from '../../../config/constants.js';


const getMyRestaurant = async()=>{
    const { data } = await axios.get(
        `${apiBaseUrl}/restaurant/my`,
        getAuthHeader()
    );

    const restaurant = 
        data?.data?.restaurant ??
        data?.restaurant ??
        null;

    return restaurant;
};

const getMenuItems = async({
    restaurantId
})=>{

    const { data } = await axios.get(
      `${apiBaseUrl}/restaurant/menu/all/${restaurantId}`,
      getAuthHeader()
    );

    return data?.data?.menuItems ?? data?.menuItems ?? [];
};

const getOrders = async()=>{

    const { data } = await axios.get(
        `${apiBaseUrl}/order/restaurant`,
        getAuthHeader()
    );

    return data?.data?.orders ??  data?.orders ?? [];
};

const getOrder = async({
    orderId
})=>{

    const { data } = await axios.get(
        `${apiBaseUrl}/order/restaurant/${orderId}`,
        getAuthHeader()
    );

    return data?.data?.order ??  data?.order ?? null;
};

const updateRestaurantOrderStatus = async({
    orderId,
    status,
    restaurantOrderId
})=>{

       await axios.patch(
            `${apiBaseUrl}/order/restaurant/${orderId}`,
            {
                status,
                restaurantOrderId
            },
            getAuthHeader()
        );

};

const getRestaurantById = async({
    restaurantId
})=>{
    const {data} = await axios.get(
        `${apiBaseUrl}/restaurant/${restaurantId}`,
        getAuthHeader()
    );

    return data?.restaurant ?? data?.data?.restaurant ?? null;
};

const addMenuItemService = async({
    formData
})=>{

    const header = getAuthHeader();

    const config = {
        headers: {
            ...header.headers,
            'Content-Type': 'multipart/form-data'
        }
    };

    const { data } = await axios.post(
        `${apiBaseUrl}/restaurant/menu/add-item`,
        formData,
        config
    );

    return data?.message ?? data?.data?.message ?? "Menu item added successfully";
};

const addRestaurantService = async({
    formData
})=>{

    const header = getAuthHeader();

    const config = {
        headers: {
            ...header.headers,
            'Content-Type': 'multipart/form-data'
        }
    };

    await axios.post(
        `${apiBaseUrl}/restaurant/add`,
        formData,
        config
    );

    return "Menu item added successfully.";
};

const updateOpenStatus = async({
    status
})=>{

    const { data } = await axios.patch(
        `${apiBaseUrl}/restaurant/status`,
        { status },
        getAuthHeader()
    );

    return data?.restaurant ?? data?.data?.restaurant ?? null; 

};

const updateProfile = async({
    name,
    description
})=>{
    
    await axios.patch(
        `${apiBaseUrl}/restaurant/edit`,
        { name, description },
        getAuthHeader()
    );

    return "Restaurant updated successfully."
};


export {
    getMyRestaurant,
    getMenuItems,
    getOrders,
    getOrder,
    updateRestaurantOrderStatus,
    getRestaurantById,
    addMenuItemService,
    addRestaurantService,
    updateOpenStatus,
    updateProfile
}