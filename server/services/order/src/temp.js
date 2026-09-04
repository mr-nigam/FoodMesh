 const pMethod =
        typeof paymentMethod === "string"
            ? paymentMethod.trim().toLowerCase()
            : null;

    const validPaymentMethods = [
        "cash",
        "razorpay",
        "stripe"
    ];

    if(!validPaymentMethods.includes(pMethod)){
        throw new ApiError(
            400,
            "Invalid payment method"
        );
    }