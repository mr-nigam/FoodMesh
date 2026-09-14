const ORDER_ACTIONS = {
    placed: ["accepted", "rejected"],
    created: ["accepted", "rejected"],
    pending: ["accepted", "rejected"],
    confirmed: ["accepted", "rejected"],
    accepted: ["preparing", "rejected"],
    preparing: ["ready"],
    ready: [],
    rider_assigned: [],
    picked_up: [],
    on_the_way: [],
    delivered: [],
    cancelled: [],
    rejected: [],
    failed: []
};

export { ORDER_ACTIONS };
export default ORDER_ACTIONS;