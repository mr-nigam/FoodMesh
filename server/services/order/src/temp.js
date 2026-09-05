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

 // yup done it baby
    try{
        payment = await createPaymentForOrder({
            userId,
            orderId: createdOrder.id,
            amount: globalTotal,
            currency: "INR",
            paymentMethod
        });
    }catch(paymentError){
        console.error(
            "Payment creation for order failed:",
            paymentError?.message || paymentError
        );
    }
