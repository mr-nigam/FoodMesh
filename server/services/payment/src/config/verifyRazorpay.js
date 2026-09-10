import crypto from 'crypto';


const verifyRazorpaySignature = ({
    orderId,
    paymentId,
    signature
})=>{
    const secret = process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        throw new Error("Razorpay secret key is not configured in environment");
    }

    const body = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    if (!signature || signature.length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(signature, "utf8")
    );
};


export default verifyRazorpaySignature;