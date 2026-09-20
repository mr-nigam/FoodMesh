import pool from '../config/postgre.js';

import {
    ApiError
} from '@foodmesh/utils';

import {
    publishEvent,
    KAFKA_TOPICS,
    KAFKA_EVENTS,
    createOrdersEvent
} from "@foodmesh/kafka";

import {
    setCache,
    deleteMultipleCache
} from '@foodmesh/redis';

import {
    getAddress,
    getCartData,
    deleteCartData
} from '../clients/user.js';

import { 
    emitRealtimeEvent 
} from '../clients/realtime.js';

import {
    COIOrdersTableRepo,
    COIRestarurantTableRepo,
    COIItemsTableRepo
} from '../repositories/createOrder.js';


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
    data
}) => {

    const {
        address,
        addressId,
        restaurantId = null
    } = data || {};

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

    const platformFee = globalSubtotal > 0 ? 600 : 0; // ₹6.00
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

        if (createdOrder) {
            createdOrder.id = createdOrder.id || createdOrder.order_id;
            createdOrder.order_id = createdOrder.id;
        }

        const primaryOrderId = createdOrder.id;

        // order_restaurants
        for(const row of cartData){

            const taxAmount = Math.round(Number(row.total_value || row.totalValue || 0) * 0.05); // 5% GST

            const createdROrder = await COIRestarurantTableRepo({
                client,
                userId,
                orderId: primaryOrderId,
                restaurant: row.restaurant,
                subtotal: Number(row.total_value || row.totalValue || 0),
                taxAmount
            });

            const primaryOrderRestaurantId = createdROrder.id || createdROrder.order_restaurant_id;

            // order_items
            for(const item of row.items){
                await COIItemsTableRepo({
                    client,
                    orderId: primaryOrderId,
                    orderRestaurantId: primaryOrderRestaurantId,
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

    const orderCreatedEvent = createOrdersEvent({
        eventType: KAFKA_EVENTS.ORDER.CREATED,
        eventData: {
            orderId: createdOrder.id,
            userId,
            totalAmount: createdOrder.total_amount,
            requestType: targetRestId ? "single" : "all"
        }
    }); 

    const orderStatusCacheKey = `orderId:${createdOrder.id}:status`;

    const keysToDelete = [
        `user:${userId}:orders`
    ];

    const restaurantRealtimeTasks = createdOrderRestaurants
        .filter(rOrder => rOrder?.restaurant_id)
        .map(rOrder => {

            keysToDelete.push(
                `restaurant:${rOrder.restaurant_id}:orders`
            );

            return emitRealtimeEvent({
                event: "order:new",
                room: `restaurant:${rOrder.restaurant_id}`,
                payload: {
                    orderId: createdOrder.id,
                    orderRestaurantId: rOrder.id,
                    restaurantId: rOrder.restaurant_id,
                    totalAmount: rOrder.total_amount,
                    recipientName: createdOrder.recipient_name,
                    status: rOrder.status
                }
            });
        });
    
    // Cart cleanup AFTER successful commit
    // create and publish event in kafka
    // Realtime notification to user
    // Remove existing caches from redis related to this event
    // store order state in redis
    const postCommitTasks = [
        deleteCartData({
            userId,
            restaurantId: targetRestId,
            requestType: targetRestId ? "single" : "all"
        }),
        publishEvent({
            topic: KAFKA_TOPICS.ORDER,
            key: createdOrder.id,
            event: orderCreatedEvent
        }),
        emitRealtimeEvent({
            event: "order:new",
            room: `user:${userId}`,
            payload: {
                orderId: createdOrder.id,
                status: createdOrder.status,
                totalAmount: createdOrder.total_amount
            }
        }),
        deleteMultipleCache({
            keys: keysToDelete
        }),
        setCache({
            key: orderStatusCacheKey,
            value: "created",
            ttl: 1200
        })
    ];

    await Promise.allSettled(postCommitTasks);
    await Promise.allSettled(restaurantRealtimeTasks);

    console.log("order created & realtime notifications dispatched");
    
    return createdOrder;
};


export default createOrderService;
