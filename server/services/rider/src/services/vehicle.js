import {
    ApiError
} from '@foodmesh/utils';

import {
    fetchProfileRepo
} from '../repositories/rider.js';

import {
    addVehicleRepo,
    fetchVehiclesRepo,
    setPrimaryVehicleRepo
} from '../repositories/vehicle.js';


const addVehicleService = async({
    riderId,
    data
})=>{

    if(!riderId){
        throw new ApiError(
            400, 
            "Rider id is missing"
        );
    }

    const vehicleType = data?.vehicleType?.trim();
    if(!vehicleType){
        throw new ApiError(
            400,
            "Vehicle type is required"
        );
    }

    return await addVehicleRepo({
        riderId,
        vehicleType,
        manufacturer: data?.manufacturer?.trim(),
        model: data?.model?.trim(),
        color: data?.color?.trim(),
        registrationNumber: data?.registrationNumber?.trim(),
        registrationExpiryDate: data?.registrationExpiryDate,
        isPrimary: data?.isPrimary ?? false
    });
};

const fetchVehiclesService = async({
    riderId
})=>{
    
    if(!riderId){
        throw new ApiError(
            400, 
            "Rider id is missing"
        );
    }

    return await fetchVehiclesRepo({ 
        riderId
    });
};

const setPrimaryVehicleService = async({
    riderId,
    vehicleId
})=>{
    
    if(!riderId){
        throw new ApiError(
            400, 
            "Rider id is missing"
        );
    }

    return await setPrimaryVehicleRepo({
        riderId,
        vehicleId
    });
};


export {
    addVehicleService,
    fetchVehiclesService,
    setPrimaryVehicleService
};