
// COI  = createOrderIn
const COIOrdersTableRepo = async({
    client,
    userId,
    recipientName,
    recipientPhone,
    deliveryAddress,
    globalSubtotal,
    globalDelivery,
    globalTax,
    globalTotal
}) => { 
    
    let formattedAddressObj = null;
    if (deliveryAddress) {
        if (typeof deliveryAddress === 'object') {
            formattedAddressObj = JSON.stringify(deliveryAddress);
        } else if (typeof deliveryAddress === 'string') {
            const str = deliveryAddress.trim();
            if (str.startsWith('{') || str.startsWith('[') || str.startsWith('"')) {
                formattedAddressObj = str;
            } else {
                formattedAddressObj = JSON.stringify(str);
            }
        }
    } else {
        formattedAddressObj = JSON.stringify({});
    }

    const values = [
        userId,
        recipientName,
        recipientPhone,
        formattedAddressObj,
        Number(globalSubtotal),
        Number(globalDelivery),
        Number(globalTax),
        Number(globalTotal)  
    ];

    const orderInsertQuery = `
        INSERT INTO orders (
            user_id,
            recipient_name,
            recipient_phone,
            delivery_address,
            status,
            subtotal,
            delivery_fee,
            tax_amount,
            total_amount
        )
        VALUES (
            $1, $2, $3,
            $4, 'placed', 
            $5, $6, $7, $8
        )
        RETURNING 
            id,
            user_id,
            recipient_name,
            recipient_phone,
            status,
            subtotal,
            delivery_fee,
            tax_amount,
            total_amount,
            created_at;
    `;

    const {rows} = await client.query(
        orderInsertQuery,
        values
    );

    return rows[0];
};

const COIRestarurantTableRepo = async({
    client,
    orderId,
    restaurant,
    subtotal,
    taxAmount
}) => { 
    
    const deliveryFee = 4500; // ₹45.00
    const numSubtotal = Number(subtotal || 0);
    const numTaxAmount = Number(taxAmount || 0);
    const totalAmount = numSubtotal + numTaxAmount + deliveryFee;

    let lng = 0, lat = 0;
    if (restaurant.location) {
        if (typeof restaurant.location === 'object') {
            lng = Number(restaurant.location.x ?? restaurant.location.longitude ?? restaurant.location.coordinates?.[0] ?? 0);
            lat = Number(restaurant.location.y ?? restaurant.location.latitude ?? restaurant.location.coordinates?.[1] ?? 0);
        } else if (typeof restaurant.location === 'string') {
            const match = restaurant.location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
            if (match) {
                lng = Number(match[1]);
                lat = Number(match[2]);
            }
        }
    }

    let phone = restaurant.phone || null;
    if (phone && !phone.startsWith('+')) {
        phone = '+' + phone;
    }

    let formattedRestaurantAddress = JSON.stringify({});
    if (restaurant.address) {
        if (typeof restaurant.address === 'object') {
            formattedRestaurantAddress = JSON.stringify(restaurant.address);
        } else if (typeof restaurant.address === 'string') {
            const str = restaurant.address.trim();
            if (str.startsWith('{') || str.startsWith('[') || str.startsWith('"')) {
                formattedRestaurantAddress = str;
            } else {
                formattedRestaurantAddress = JSON.stringify(str);
            }
        }
    }

    const values = [
        orderId,
        restaurant.id,
        restaurant.name,
        phone,
        lng,
        lat,
        formattedRestaurantAddress,
        numSubtotal,
        numTaxAmount,
        deliveryFee,
        totalAmount
    ];

    const rOrderInsertQuery = `
        INSERT INTO order_restaurants (
            order_id,
            restaurant_id,
            restaurant_name,
            restaurant_phone,
            restaurant_location,
            restaurant_address,
            subtotal,
            tax_amount,
            delivery_fee,
            total_amount,
            status
        )
        VALUES (
            $1, $2, $3, $4,
            ST_SetSRID(ST_MakePoint($5, $6), 4326)::GEOGRAPHY,
            $7, $8, $9, $10, $11, 'placed'
        )
        RETURNING 
            id,
            order_id,
            restaurant_id,
            restaurant_name,
            subtotal,
            tax_amount,
            delivery_fee,
            total_amount,
            status;
    `;

    const {rows} = await client.query(
        rOrderInsertQuery,
        values
    );
    
    return rows[0];
};

const COIItemsTableRepo = async({ 
    client,
    orderRestaurantId,
    item
}) => { 

    const itemId = item.item_id || item.id;
    const cartId = item.cart_id || item.id || globalThis.crypto?.randomUUID?.() || '00000000-0000-0000-0000-000000000000';
    const itemName = item.name || item.item_name || "";
    const unitPrice = Number(item.price ?? item.unit_price ?? 0);
    const quantity = Number(item.quantity || 1);
    const subtotal = Number(item.subtotal ?? (unitPrice * quantity));

    const values = [
        orderRestaurantId,
        cartId,
        itemId,
        itemName,
        unitPrice,
        quantity,
        subtotal
    ];
    
    const IOrderInsertQuery = `
        INSERT INTO order_items (
            order_restaurant_id,
            cart_id,
            item_id,
            item_name,
            unit_price,
            quantity,
            subtotal
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6,
            $7
        )
        RETURNING
            id,
            cart_id,
            item_id,
            order_restaurant_id,
            item_name,
            unit_price,
            quantity,
            subtotal;
    `;

    const {rows} = await client.query(
        IOrderInsertQuery,
        values
    );

    return rows[0];
};


export {
    COIOrdersTableRepo,
    COIRestarurantTableRepo,
    COIItemsTableRepo
};