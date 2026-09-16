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
    userId,
    data
})=>{
    const rider = await fetchProfileRepo({ userId, riderId: null });
    if(!rider){
        throw new ApiError(404, "Rider profile not found");
    }

    const vehicleType = data?.vehicleType?.trim();
    if(!vehicleType){
        throw new ApiError(400, "Vehicle type is required");
    }

    return await addVehicleRepo({
        riderId: rider.id,
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
    userId
})=>{
    const rider = await fetchProfileRepo({ userId, riderId: null });
    if(!rider){
        throw new ApiError(404, "Rider profile not found");
    }

    return await fetchVehiclesRepo({ riderId: rider.id });
};

const setPrimaryVehicleService = async({
    userId,
    vehicleId
})=>{
    const rider = await fetchProfileRepo({ userId, riderId: null });
    if(!rider){
        throw new ApiError(404, "Rider profile not found");
    }

    return await setPrimaryVehicleRepo({
        riderId: rider.id,
        vehicleId
    });
};


export {
    addVehicleService,
    fetchVehiclesService,
    setPrimaryVehicleService
};