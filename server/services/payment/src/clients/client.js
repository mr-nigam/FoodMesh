import axios from 'axios';


const getBaseUrl = (url, prefix) => {
    if (!url) return '';
    const cleanUrl = url.replace(/\/$/, '');
    return cleanUrl.endsWith(prefix) ? cleanUrl : `${cleanUrl}${prefix}`;
};

const ORDER_SERVICE = getBaseUrl(process.env.ORDER_SERVICE_URL, '/api/v1/order');
const PAYMENT_SERVICE_KEY = process.env.PAYMENT_SERVICE_KEY;

const getOrderForPayment = async({
    userId,
    orderId
}) => {
    const { data } = await axios.get(
        `${ORDER_SERVICE}/internal/orders/${orderId}/users/${userId}`,
        {
            headers: {
                "x-service-name": "payment-service",
                "x-service-key": PAYMENT_SERVICE_KEY
            }
        }
    );

    return data?.data?.order ?? data?.order ?? null;
};


export {
    getOrderForPayment
};