import {
    asyncHandler,
    ApiResponse
} from '@foodmesh/utils';

import {
    addVehicleService,
    fetchVehiclesService,
    setPrimaryVehicleService
} from '../services/vehicle.js';


const addVehicle = asyncHandler(async(req, res)=>{
    const vehicle = await addVehicleService({
        riderId: req.user?.riderId,
        data: req.body
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { vehicle },
                "Vehicle added successfully"
            )
        );
});

const fetchVehicles = asyncHandler(async(req, res)=>{
    const vehicles = await fetchVehiclesService({
        riderId: req.user?.riderId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { vehicles },
                "Vehicles fetched successfully"
            )
        );
});

const setPrimaryVehicle = asyncHandler(async(req, res)=>{

    const vehicle = await setPrimaryVehicleService({
        riderId: req.user?.riderId,
        vehicleId: req.params.vehicleId
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { vehicle },
                "Primary vehicle updated successfully"
            )
        );
});


export {
    addVehicle,
    fetchVehicles,
    setPrimaryVehicle
};
