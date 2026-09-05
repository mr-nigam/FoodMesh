import {
    ApiError
} from '@foodmesh/utils';

import { 
    fetchMyOrdersRepo
} from '../repositories/user.repo.js';


const fetchMyOrdersService = async({
    userId
}) => {
    if(!userId){
        throw new ApiError(
            400,
            "Please provide user id"
        );
    }
     
    const orders = await fetchMyOrdersRepo({
        userId
    });

    return orders;
};


export {
    fetchMyOrdersService
};