import '@foodmesh/utils/config/env';
import Razorpay from 'razorpay';

const key_id = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_API_KEY || 'rzp_test_TWaQFqWLH8p8lA';
const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || 'Z4PlUOvv5dj53Nsj42RRplug';

const razorpay = new Razorpay({
    key_id,
    key_secret
});

export default razorpay;