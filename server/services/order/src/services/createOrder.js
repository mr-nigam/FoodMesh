import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';

import {
    getAddress,
    getCartData,
    deleteCartData
} from '../clients/user.client.js';

import {
    COIOrdersTableRepo,
    COIRestarurantTableRepo,
    COIItemsTableRepo
} from '../repositories/createOrder.js';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createOrdersEvent
} from "@foodmesh/kafka";


const getAddressService = async({
    userId,
    address,
    addressId
}) => {

    let deliveryAddress = null;
    let recipientPhone = null;
    let recipientName = null;

    if(addressId?.trim()){
        const addr = await getAddress({
            userId,
            addressId
        });

        if(!addr){
            throw new ApiError(
                404,
                "Selected delivery address not found"
            );
        }

        recipientPhone = addr.recipient_phone;
        recipientName = addr.recipient_name;
        
        deliveryAddress = {
            id: addr.id,
            label: addr.label,
            recipientName: addr.recipient_name,
            recipientPhone: addr.recipient_phone,
            addressLine1: addr.address_line_1,
            addressLine2: addr.address_line_2,
            landmark: addr.landmark,
            city: addr.city,
            state: addr.state,
            postalCode: addr.postal_code,
            countryCode: addr.country_code,
            formattedAddress: addr.formatted_address || `${addr.address_line_1}, ${addr.city}`,
            latitude: addr.latitude,
            longitude: addr.longitude
        };

    }else if(address && typeof address === 'object'){
        const { 
            formattedAddress,
            latitude,
            longitude
        } = address;

        if(
            !formattedAddress ||
            latitude === undefined || 
            longitude === undefined || 
            !address.recipientName || 
            !address.recipientPhone
        ){
            throw new ApiError(
                400,
                "Incomplete custom delivery address details provided"
            );
        }

        recipientName = String(address.recipientName).trim();
        recipientPhone = String(address.recipientPhone).trim();

        deliveryAddress = {
            recipientName,
            recipientPhone,
            formattedAddress: formattedAddress.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            city: address.city?.trim() || "",
            state: address.state?.trim() || "",
            postalCode: address.postalCode?.trim() || ""
        };

    }else{
        throw new ApiError(
            400,
            "Please provide a valid addressId or custom delivery address"
        );
    }

    return {
        recipientName,
        recipientPhone,
        deliveryAddress
    };
};

const createOrderService = async ({ 
    userId,
    body 
}) => {

    const {
        address,
        addressId,
        restaurantId = null
    } = body || {};

    // 1. Resolve Delivery Address
    const {
        recipientName,
        recipientPhone,
        deliveryAddress
    } = await getAddressService({
        userId,
        address,
        addressId
    });

    // 2. Normalize restaurant   
    const targetRestId =
        typeof restaurantId === "string"
            ? restaurantId.trim() || null
            : null;
    
    // 3. Fetch cart
    const cartData = targetRestId
        ? await getCartData({
            userId,
            targetRestId
        }) 
        : await getCartData({
            userId
        });

    if(
        !Array.isArray(cartData) || 
        cartData.length === 0
    ){
        throw new ApiError(
            400,
            "Cart is empty"
        );
    }

    // 4. Validate cart + calculate totals
    let globalSubtotal = 0;
    let globalTax = 0;
    let globalDelivery = 0;
    
    for(const row of cartData){
        if(!row.restaurant){
            throw new ApiError(
                400,
                "Invalid restaurant data"
            );
        }

        if(row.restaurant.is_open === false){
            throw new ApiError(
                400,
                `${row.restaurant.name} is currently closed`
            );
        }
        
        if(
            !Array.isArray(row.items) || 
            row.items.length === 0
        ){
            throw new ApiError(
                400,
                `No items found for ${row.restaurant.name}`
            );
        }

        for(const item of row.items){
            if(item.is_available === false){
                const itemName = item.name || item.item_name || "Item";
                throw new ApiError(400,
                    `Item "${itemName}" is currently unavailable`
                );
            }
        }
        
        const subtotal = Number(row.total_value || row.totalValue || 0);

        if(!Number.isFinite(subtotal) || subtotal < 0){
            throw new ApiError(
                400,
                "Invalid cart subtotal"
            );
        }

        const taxAmount = Math.round(subtotal * 0.05);
        const deliveryFee = 4500;

        globalSubtotal += subtotal;
        globalTax += taxAmount;
        globalDelivery += deliveryFee;
    }

    const platformFee = 1000; // ₹10.00
    const globalTotal = globalSubtotal + globalTax + globalDelivery + platformFee;

    // 5. Execute PostgreSQL Transaction
    const client = await pool.connect();

    let createdOrder;
    const createdOrderRestaurants = [];

    try {
        await client.query("BEGIN");

        const formattedPhone = recipientPhone && !recipientPhone.startsWith('+') 
            ? '+' + recipientPhone 
            : recipientPhone;

        const formattedName = recipientName?.trim() || "account_holder";

        createdOrder = await COIOrdersTableRepo({
            client,
            userId,
            recipientName: formattedName,
            recipientPhone: formattedPhone,
            deliveryAddress,
            globalSubtotal,
            globalDelivery,
            globalTax,
            globalTotal  
        });

        // order_restaurants
        for(const row of cartData){

            const taxAmount = Math.round(Number(row.total_value || row.totalValue || 0) * 0.05); // 5% GST

            const createdROrder = await COIRestarurantTableRepo({
                client,
                orderId: createdOrder.id,
                restaurant: row.restaurant,
                subtotal: Number(row.total_value || row.totalValue || 0),
                taxAmount
            });

            // order_items
            for(const item of row.items){
                await COIItemsTableRepo({
                    client,
                    orderRestaurantId: createdROrder.id,
                    item
                });
                
            }

            createdOrderRestaurants.push(createdROrder);
        }

        await client.query("COMMIT");

    }catch(error){
        await client.query("ROLLBACK");

        console.error(
            "Order Transaction Error:",
            error
        );
        
        throw new ApiError(
            500,
            error.message || 
            "Failed to process order creation"
        );

    }finally{
        client.release();
    }

    // 6. Cart cleanup AFTER successful commit
    try{
        await deleteCartData({
            userId,
            restaurantId: targetRestId,
            requestType: targetRestId ? "single" : "all"
        });
    }catch(error){
        console.error("Cart deletion failed after order creation", {
            userId,
            restaurantId: targetRestId,
            orderId: createdOrder.id,
            error: error.message
        });
    }

    const orderCreatedEvent = createOrdersEvent({
        eventType: KAFKA_EVENTS.ORDER.CREATED,
        eventData: {
            orderId: createdOrder.id,
            userId,
            restaurantId,
            totalAmount: createdOrder.total_amount
        }
    });

    await publishEvent({
        topic: KAFKA_TOPICS.ORDER,
        key: createdOrder.id,
        event: orderCreatedEvent
    });

    return {
        orderDetails: createdOrder,
        orderRestaurants: createdOrderRestaurants,
        deliveryAddress: deliveryAddress
    };
};


export default createOrderService;
