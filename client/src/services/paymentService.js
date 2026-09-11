import axios from "axios";

import {
    paymentService as paymentBaseUrl
} from "../config/constants.js";


const getAuthConfig = () => {

    const token = localStorage.getItem("token");

    return token
        ? {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        : {};
};


const extractPayment = (data) => {

    return (
        data?.data?.payment ||
        data?.payment ||
        data?.data ||
        null
    );
};


/**
 * Create or retrieve a payment attempt.
 *
 * Backend should make this operation idempotent.
 */
const createPayment = async ({
    orderId,
    vendor
}) => {

    const { data } = await axios.post(
        paymentBaseUrl,
        {
            orderId,
            vendor
        },
        getAuthConfig()
    );

    return extractPayment(data);
};


/**
 * Verify a browser-side provider payment.
 *
 * Webhooks should still be the authoritative
 * asynchronous confirmation mechanism.
 */
const verifyPayment = async (payload) => {

    const { data } = await axios.post(
        `${paymentBaseUrl}/verify`,
        payload,
        getAuthConfig()
    );

    const verificationDetails = 
        data?.data?.result ||
        data?.result ||
        null;

    return verificationDetails;
};


/**
 * Confirm COD with the backend.
 */
const confirmCod = async ({
    orderId
}) => {

    const { data } = await axios.post(
        `${paymentBaseUrl}/cod`,
        {
            orderId
        },
        getAuthConfig()
    );

    return data;
};


export {
    createPayment,
    verifyPayment,
    confirmCod
};