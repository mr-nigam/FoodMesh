// COI  = Create Order In

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
    
    const values = [
        userId,
        recipientName,
        recipientPhone,
        JSON.stringify(deliveryAddress),
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
            $4, 'created', 
            $5, $6, $7, $8
        )
        RETURNING 
            id,
            id AS order_id,
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
    userId,
    orderId,
    restaurant,
    subtotal,
    taxAmount
}) => { 
    
    const deliveryFee = 4500; // ₹45.00
    const totalAmount = subtotal + taxAmount + deliveryFee;

    const values = [
        orderId,
        userId,
        restaurant.id,
        restaurant.name,
        restaurant.phone,
        restaurant.location,
        JSON.stringify(restaurant.address),
        Number(subtotal),
        Number(taxAmount),
        Number(deliveryFee),
        totalAmount
    ];

    const rOrderInsertQuery = `
        INSERT INTO order_restaurants (
            order_id,
            user_id,
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
            $5, $6, $7, $8, 
            $9, $10, $11, 'created'
        )
        RETURNING 
            id,
            id AS order_restaurant_id,
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
    orderId,
    orderRestaurantId,
    item
}) => { 

    const itemId = item.item_id || item.id;
    const cartId = item.cart_id ?? null;
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
        subtotal,
        orderId
    ];
    
    const IOrderInsertQuery = `
        INSERT INTO order_items (
            order_restaurant_id,
            cart_id,
            item_id,
            item_name,
            unit_price,
            quantity,
            subtotal,
            order_id
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6,
            $7, $8
        )
        RETURNING
            id,
            order_id,
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