import crypto from 'crypto';


const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    signature
})=>{

    const body = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex")

    if (!signature || signature.length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(signature, "utf8")
    );
};


export default verifyRazorpaySignature;