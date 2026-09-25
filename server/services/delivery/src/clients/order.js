import axios from "axios";


const getOrderData = async ({
    orderId,
    restaurantOrderId
})=>{

    const orderServiceUrl = 
        process.env.ORDER_SERVICE_URL ?? 
        "http://localhost:4006/api/v1/order";

    try{
        const {data} = await axios.get(
            `${orderServiceUrl}/internal/delivery/${restaurantOrderId}`,
            {
                params:{
                    orderId
                },
                headers:{
                    'x-service-name': 'delivery-service',
                    'x-service-key': process.env.DELIVERY_SERVICE_KEY || 'delivery_service_secret_123',
                },
                timeout: 3000,
            }
        );

        const order = 
            data?.order ??
            data?.data?.order;

        return order;
    }catch(error){
        console.log(`Failed to fetch order`, error);
        return "";
    };
};


export {
    getOrderData
}