import axios from 'axios';
import { riderService, analyticsService } from '../../../config/constants.js';
import getAuthHeader from '../../../config/getAuthHeader.js';

export const getRiderProfile = async () => {
    const res = await axios.get(`${riderService}/me`, getAuthHeader());
    return res.data?.data?.profile || res.data?.profile;
};

export const registerRider = async (formData) => {
    const header = getAuthHeader();
    const config = {
        headers: {
            ...header.headers,
            'Content-Type': 'multipart/form-data'
        }
    };
    const res = await axios.post(`${riderService}/register`, formData, config);
    return res.data?.data?.rider || res.data?.rider;
};

export const toggleRiderAvailability = async (availabilityStatus) => {
    const res = await axios.patch(
        `${riderService}/availability-status`,
        { availabilityStatus },
        getAuthHeader()
    );
    return res.data?.data?.rider || res.data?.rider;
};

export const updateRiderLocation = async (longitude, latitude) => {
    const res = await axios.patch(
        `${riderService}/location`,
        { longitude, latitude },
        getAuthHeader()
    );
    return res.data?.data?.rider || res.data?.rider;
};

export const getRiderVehicles = async () => {
    const res = await axios.get(`${riderService}/vehicles`, getAuthHeader());
    return res.data?.data?.vehicles || [];
};

export const addRiderVehicle = async (vehicleData) => {
    const res = await axios.post(`${riderService}/vehicles`, vehicleData, getAuthHeader());
    return res.data?.data?.vehicle;
};

export const getRiderMetrics = async (riderId) => {
    const url = riderId 
        ? `${analyticsService}/${riderId}/metrics`
        : `${analyticsService}/metrics`;
    const res = await axios.get(url, getAuthHeader());
    return res.data?.data?.metrics || res.data?.metrics;
};
