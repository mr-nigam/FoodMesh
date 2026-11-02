import axios from 'axios';

import getAuthHeader from 
'../../../config/getAuthHeader.js';

import {
    apiBaseUrl
} from '../../../config/constants.js';


const acceptDeliveryOffer = async ({ 
    offerId,
    deliveryId
}) => {

    try{
        const { data } = await axios.put(
            `${apiBaseUrl}/delivery/offers/${offerId}/accept`,
            { deliveryId },
            getAuthHeader()
        );
        
        return data?.data?.delivery ?? data?.delivery;

    }catch(error){
        console.error("acceptDeliveryOffer error:", error.response?.data || error.message);
        throw error;
    }
};

const rejectDeliveryOffer = async ({
    offerId
}) => {

    try{
        const { data } = await axios.put(
            `${apiBaseUrl}/delivery/offers/${offerId}/reject`,
            {},
            getAuthHeader()
        );

        return  data?.data?.delivery ?? data?.delivery

    }catch(error){
        console.log(error);
    }
};

const getActiveDelivery = async () => {
    try {
        const { data } = await axios.get(
            `${apiBaseUrl}/delivery/active`,
            getAuthHeader()
        );

        return data?.data?.delivery || data?.delivery || null;
    // eslint-disable-next-line no-unused-vars
    }catch (err){
        return null;
    }
};

const updateDeliveryProgress = async ({
    deliveryId,
    status
}) => {

    try{
        const { data } = await axios.patch(
            `${apiBaseUrl}/delivery/${deliveryId}/status`,
            { status },
            getAuthHeader()
        );

        return data?.data?.delivery ?? data?.delivery;
        
    }catch(error){
        console.log(error);
    }
};


export {
    acceptDeliveryOffer,
    rejectDeliveryOffer,
    getActiveDelivery,
    updateDeliveryProgress
};