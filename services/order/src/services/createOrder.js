import pool from '../config/postgre.js';
import ApiError from '../utils/apiError.js';

import {
    getAddress,
    getAllCartItems,
    getSingleRestaurantCartItems
} from '../clients/user.client.js';


import {
    fetchAddressRepo,
    fetchCartItemsRepo
} from '../repositories/order.js';


const singleService = async({

}) =>{

};

const allService = async({

}) =>{

};

const createOrderService = async ({ user, body }) => {
    const userId = user?.id;

    const {
        restaurantId,
        addressId,
        address,
        paymentMethod = 'cash',
        orderType
    } = body || {};


    // 1. Resolve Delivery Address
    let deliveryAddressObj = null;
    let userPhone = null;

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

        userPhone = addr.phone;
        deliveryAddressObj = {
            id: addr.id,
            label: addr.label,
            recipientName: addr.recipient_name,
            phone: addr.phone,
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
            longitude,
            recipientName,
            phone 
        } = address;

        if(
            !formattedAddress ||
            latitude === undefined || 
            longitude === undefined || 
            !recipientName || 
            !phone
        ){
            throw new ApiError(
                400,
                "Incomplete custom delivery address details provided"
            );
        }

        userPhone = phone.trim();
        deliveryAddressObj = {
            recipientName: recipientName.trim(),
            phone: userPhone,
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

    // 2. Fetch Cart Items & Live Menu Data for the user
    const targetRestId = restaurantId?.trim() || null;

    const cartRows = await fetchCartItemsRepo({
        userId,
        targetRestId
    });

    // Check restaurant status and item availability
    for(const item of cartRows){
        if(item.is_open === false){
            throw new ApiError(
                400,
                `${item.restaurant_name} is currently closed`
            );
        }
        if(item.is_available === false){
            throw new ApiError(400,
                `Item "${item.item_name}" is currently unavailable`
            );
        }
    }

    // 3. Group Cart Items by Restaurant & Calculate Fee Breakdowns
    const restaurantGroupsMap = new Map();

    for (const row of cartRows) {
        const rId = row.restaurant_id;
        if (!restaurantGroupsMap.has(rId)) {
            restaurantGroupsMap.set(rId, {
                restaurantId: rId,
                restaurantName: row.restaurant_name,
                items: [],
                subtotal: 0
            });
        }

        const group = restaurantGroupsMap.get(rId);
        const itemPrice = Number(row.menu_price || row.cart_price || 0);
        const itemSubtotal = itemPrice * Number(row.quantity);

        group.items.push({
            cart_id: row.cart_id,
            item_id: row.item_id,
            item_name: row.item_name,
            unit_price: itemPrice,
            quantity: Number(row.quantity),
            subtotal: itemSubtotal
        });

        group.subtotal += itemSubtotal;
    }

    // Calculate fees per restaurant and globally
    let globalSubtotal = 0;
    let globalTax = 0;
    let globalDelivery = 0;

    const restaurantGroups = Array.from(restaurantGroupsMap.values()).map((group) => {
        const taxAmount = Math.round(group.subtotal * 0.05); // 5% GST
        const deliveryFee = 4500; // ₹45.00
        const packagingFee = 1000; // ₹10.00
        const restaurantTotal = group.subtotal + taxAmount + deliveryFee + packagingFee;

        globalSubtotal += group.subtotal;
        globalTax += taxAmount;
        globalDelivery += deliveryFee;

        return {
            ...group,
            taxAmount,
            deliveryFee,
            packagingFee,
            restaurantTotal
        };
    });

    const platformFee = 500; // ₹5.00
    const globalTotal = globalSubtotal + globalTax + globalDelivery + platformFee;

    // Validate payment method
    const validPaymentMethods = ['cash', 'razorpay', 'stripe'];
    const pMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'cash';

    // 4. Execute PostgreSQL Transaction
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const values = [
            userId,
            userPhone,
            JSON.stringify(deliveryAddressObj),
            pMethod,
            globalSubtotal,
            globalDelivery,
            globalTax,
            globalTotal  
        ];

        // Insert main order record
        const orderInsertQuery = `
            INSERT INTO orders (
                user_id,
                user_phone,
                delivery_address,
                status,
                payment_method,
                payment_status,
                subtotal,
                delivery_fee,
                tax_amount,
                total_amount
            )
            VALUES ($1, $2, $3, 'placed', $4, 'pending', $5, $6, $7, $8)
            RETURNING id, user_id, user_phone, status, payment_method, payment_status, subtotal, delivery_fee, tax_amount, total_amount, created_at;
        `;

        const orderRes = await client.query(
            orderInsertQuery, values
        );

        const createdOrder = orderRes.rows[0];

        // Insert order_restaurants and order_items
        const createdOrderRestaurants = [];

        for (const rGroup of restaurantGroups){
            const rOrderInsertQuery = `
                INSERT INTO order_restaurants (
                    order_id,
                    restaurant_id,
                    restaurant_name,
                    subtotal,
                    tax_amount,
                    delivery_fee,
                    total_amount,
                    status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'placed')
                RETURNING id, order_id, restaurant_id, restaurant_name, subtotal, tax_amount, delivery_fee, total_amount, status;
            `;

            const rOrderRes = await client.query(rOrderInsertQuery, [
                createdOrder.id,
                rGroup.restaurantId,
                rGroup.restaurantName,
                rGroup.subtotal,
                rGroup.taxAmount,
                rGroup.deliveryFee,
                rGroup.restaurantTotal
            ]);

            const createdROrder = rOrderRes.rows[0];

            for (const item of rGroup.items) {
                const itemInsertQuery = `
                    INSERT INTO order_items (
                        order_restaurant_id,
                        item_id,
                        item_name,
                        unit_price,
                        quantity,
                        subtotal
                    )
                    VALUES ($1, $2, $3, $4, $5, $6);
                `;

                await client.query(itemInsertQuery, [
                    createdROrder.id,
                    item.item_id,
                    item.item_name,
                    item.unit_price,
                    item.quantity,
                    item.subtotal
                ]);
            }

            createdOrderRestaurants.push(createdROrder);
        }

        // Delete processed cart items from carts table
        const deleteCartQuery = `
            DELETE FROM carts
            WHERE user_id = $1
              AND ($2::uuid IS NULL OR restaurant_id = $2::uuid);
        `;

        await client.query(deleteCartQuery, [userId, targetRestId]);

        await client.query("COMMIT");

        return {
            order: createdOrder,
            orderRestaurants: createdOrderRestaurants,
            deliveryAddress: deliveryAddressObj
        };

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Order Transaction Error:", error);
        throw new ApiError(500, error.message || "Failed to process order creation");
    } finally {
        client.release();
    }
};


export default createOrderService;
