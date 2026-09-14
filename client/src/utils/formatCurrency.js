const formatCurrency = (amountInPaise) => {
    const num = Number(amountInPaise || 0);
    return `₹${(num / 100).toFixed(2)}`;
};


export default formatCurrency;