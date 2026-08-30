
// COI  = createOrderIn
const COIOrdersTableRepo = async({
    client,
    userId,
    userPhone,
    deliveryAddress,
    pMethod,
    globalSubtotal,
    globalDelivery,
    globalTax,
    globalTotal
}) => { 
    
    const formattedAddressObj = typeof deliveryAddress === 'string' 
        ? deliveryAddress 
        : JSON.stringify(deliveryAddress);

    const values = [
        userId,
        userPhone,
        formattedAddressObj,
        pMethod,
        Number(globalSubtotal),
        Number(globalDelivery),
        Number(globalTax),
        Number(globalTotal)  
    ];

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
        VALUES (
            $1, $2, $3,
            'placed', $4, 
            'pending', $5, 
            $6, $7, $8
        )
        RETURNING 
            id,
            user_id,
            user_phone,
            status,
            payment_method,
            payment_status,
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

    const values = [
        orderId,
        restaurant.id,
        restaurant.name,
        restaurant.phone || null,
        restaurant.location ? (typeof restaurant.location === 'string' ? restaurant.location : JSON.stringify(restaurant.location)) : null,
        restaurant.address ? (typeof restaurant.address === 'string' ? restaurant.address : JSON.stringify(restaurant.address)) : null,
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
            $5, $6, $7, $8,
            $9, $10, 'placed'
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
    const itemName = item.name || item.item_name || "";
    const unitPrice = Number(item.price ?? item.unit_price ?? 0);
    const quantity = Number(item.quantity || 1);
    const subtotal = Number(item.subtotal ?? (unitPrice * quantity));

    const values = [
        orderRestaurantId,
        itemId,
        itemName,
        unitPrice,
        quantity,
        subtotal
    ];
    
    const IOrderInsertQuery = `
        INSERT INTO order_items (
            order_restaurant_id,
            item_id,
            item_name,
            unit_price,
            quantity,
            subtotal
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6
        )
        RETURNING
            id,
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