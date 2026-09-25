const STATUS_RANK = {
    created: 0,
    confirmed: 1,
    accepted: 2,
    preparing: 3,
    ready: 4,
    rider_assigned: 5,
    picked_up: 6,
    on_the_way: 7,
    delivered: 8,
};


const getOverallOrderStatus = ({
    restaurantOrders
}) =>{

    const statuses = restaurantOrders.map(
        restaurantOrder => restaurantOrder.status
    );

    // All restaurants delivered
    if(statuses.every(status => status === "delivered")){
        return "delivered";
    }

    // Some delivered, some not
    if(statuses.some(status => status === "delivered")){
        return "partially_delivered";
    }
    
    // All order reject
    if(statuses.every(status => status === "rejected")){
        return "rejected";
    }

    // Handle exceptional states separately
    if(statuses.every(status =>
        ["cancelled", "rejected", "failed"].includes(status)
    )){
        return "failed";
    }

    // Ignore terminal failure states for normal progress calculation
    const activeStatuses = statuses.filter(
        status => STATUS_RANK[status] !== undefined
    );

    if(!activeStatuses.length){
        return "failed";
    }

    // Lowest progress reached by all restaurants
    return activeStatuses.reduce((lowest, current) => {
        return STATUS_RANK[current] < STATUS_RANK[lowest]
            ? current
            : lowest;
    });
}


export {
    getOverallOrderStatus
}