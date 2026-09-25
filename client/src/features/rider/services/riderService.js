import axios from 'axios';
import getAuthHeader from '../../../config/getAuthHeader.js';
import { 
    riderService,
    analyticsService 
} from '../../../config/constants.js';


const getRiderProfile = async () => {
    const {data} = await axios.get(
        riderService,
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
        riderService,
        formData,
        config
    );
    
    return data?.data?.rider || data?.rider;
};

const updateAvailabilityStatus = async ({
    availabilityStatus
}) => {
    const {data} = await axios.patch(
        `${riderService}/availability-status`,
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
        `${riderService}/location`,
        { longitude, latitude },
        getAuthHeader()
    );

    return data?.data?.rider || data?.rider;
};

const getRiderVehicles = async () => {
    const {data} = await axios.get(
        `${riderService}/vehicles`,
        getAuthHeader()
    );
    
    return data?.data?.vehicles || data?.vehicles || [];
};

const addRiderVehicle = async ({
    vehicleData
}) => {
    const {data} = await axios.post(
        `${riderService}/vehicles`,
        vehicleData,
        getAuthHeader()
    );
    
    return data?.data?.vehicle || data?.vehicle;
};

const setPrimaryVehicle = async ({
    vehicleId
}) => {
    const { data } = await axios.patch(
        `${riderService}/vehicles/${vehicleId}/primary`,
        getAuthHeader()
    );

    return data?.data?.vehicle || data?.vehicle;
};

const getRiderMetrics = async () => {
    const {data} = await axios.get(
        `${analyticsService}/rider/metrics`,
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