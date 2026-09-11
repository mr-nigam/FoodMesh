import {
    ApiError
} from '@foodmesh/utils';

import { 
    fetchOrdersRepo
} from '../repositories/user.js';


const consolidateSingleOrder = (rows) => {
    if (!rows || rows.length === 0) return null;
    const first = rows[0];
    return {
        id: first.order_id,
        order_id: first.order_id,
        recipient_name: first.recipient_name,
        recipient_phone: first.recipient_phone,
        delivery_address: first.delivery_address,
        status: first.status,
        subtotal: first.subtotal,
        delivery_fee: first.delivery_fee,
        tax_amount: first.tax_amount,
        discount_amount: first.discount_amount,
        total_amount: first.total_amount,
        restaurants: rows.map(r => ({
            ...r.restaurant,
            items: r.ordered_items || []
        })),
        items: rows.flatMap(r => r.ordered_items || [])
    };
};

const groupOrders = (rows) => {
    const ordersMap = new Map();
    for (const row of rows) {
        if (!ordersMap.has(row.order_id)) {
            ordersMap.set(row.order_id, {
                id: row.order_id,
                order_id: row.order_id,
                recipient_name: row.recipient_name,
                recipient_phone: row.recipient_phone,
                delivery_address: row.delivery_address,
                status: row.status,
                subtotal: row.subtotal,
                delivery_fee: row.delivery_fee,
                tax_amount: row.tax_amount,
                discount_amount: row.discount_amount,
                total_amount: row.total_amount,
                restaurants: [],
                items: []
            });
        }
        const order = ordersMap.get(row.order_id);
        if (row.restaurant) {
            order.restaurants.push({
                ...row.restaurant,
                items: row.ordered_items || []
            });
        }
        if (Array.isArray(row.ordered_items)) {
            order.items.push(...row.ordered_items);
        }
    }
    return Array.from(ordersMap.values());
};

const fetchOrdersService = async({
    userId,
    orderId = null
}) => {
     
    const orders = await fetchOrdersRepo({
        userId,
        orderId
    });

    if(orders.length === 0 && orderId){
        throw new ApiError(
            404,
            "Order not found"
        );
    }

    if (orderId) {
        return consolidateSingleOrder(orders);
    }

    return groupOrders(orders);
};


export {
    fetchOrdersService
};