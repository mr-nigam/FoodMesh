import axios from 'axios';

import getAuthHeader from '../../../config/getAuthHeader.js';

import { 
    apiBaseUrl
} from '../../../config/constants.js';


const getRiderProfile = async () => {
    const {data} = await axios.get(
        `${apiBaseUrl}/rider`,
        getAuthHeader()
    );

    return data?.data?.profile || data?.profile;
};

const registerRider = async ({formData}) => {
    const header = getAuthHeader();

    const config = {
        headers: {
            ...header.headers,
            'Content-Type': 'multipart/form-data'
        }
    };

    const {data} = await axios.post(
        `${apiBaseUrl}/rider`,
        formData,
        config
    );
    
    return data?.data?.rider || data?.rider;
};

const updateAvailabilityStatus = async ({
    availabilityStatus
}) => {
    const {data} = await axios.patch(
        `${apiBaseUrl}/rider/availability-status`,
        { availabilityStatus },
        getAuthHeader()
    );

    return data?.data?.rider || data?.rider;
};

const updateRiderLocation = async ({
    longitude,
    latitude
}) => {
    const {data} = await axios.patch(
        `${apiBaseUrl}/rider/location`,
        { longitude, latitude },
        getAuthHeader()
    );

    return data?.data?.rider || data?.rider;
};

const getRiderVehicles = async () => {
    const {data} = await axios.get(
        `${apiBaseUrl}/rider/vehicles`,
        getAuthHeader()
    );
    
    return data?.data?.vehicles || data?.vehicles || [];
};

const addRiderVehicle = async (payload) => {
    const vehicleData = payload?.vehicleData || payload;
    const {data} = await axios.post(
        `${apiBaseUrl}/rider/vehicles`,
        vehicleData,
        getAuthHeader()
    );
    
    return data?.data?.vehicle || data?.vehicle;
};

const setPrimaryVehicle = async (arg) => {
    const vehicleId = typeof arg === 'object' && arg !== null
        ? (arg.vehicleId || arg.id)
        : arg;

    const { data } = await axios.patch(
        `${apiBaseUrl}/rider/vehicles/${vehicleId}/primary`,
        {},
        getAuthHeader()
    );

    return data?.data?.vehicle || data?.vehicle;
};

const getRiderMetrics = async () => {
    const {data} = await axios.get(
        `${apiBaseUrl}/analytics/rider/metrics`,
        getAuthHeader()
    );

    return data?.data?.metrics || data?.metrics;
};


export {
    getRiderProfile,
    registerRider,
    updateAvailabilityStatus,
    updateRiderLocation,
    getRiderVehicles,
    addRiderVehicle,
    setPrimaryVehicle,
    getRiderMetrics
};
