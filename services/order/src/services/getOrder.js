import ApiError from '../utils/apiError.js';


const fetchMyOrdersService = async({
    userId
}) => {
    if(!userId){
        throw new ApiError(
            400,
            "Please provide user id"
        );
    }
     
};


export {
    fetchMyOrdersService
};