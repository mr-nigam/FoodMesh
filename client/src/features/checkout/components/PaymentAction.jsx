import RazorpayPayment from "../payment/RazorpayPayment";
import StripePayment from "../payment/StripePayment";
import CodPayment from "../payment/CodPayment";


const PaymentAction = ({
    vendor,
    order,
    user,
    onSuccess,
    onFailure
}) => {

    if(!order) return null;


    switch(vendor){

        case "razorpay":
            return (
                <RazorpayPayment
                    order={order}
                    user={user}
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                />
            );

        case "stripe":
            return (
                <StripePayment
                    order={order}
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                />
            );

        case "cod":
            return (
                <CodPayment
                    order={order}
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                />
            );


        default: return null;
    }
};


export default PaymentAction;