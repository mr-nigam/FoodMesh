import {Router} from 'express';

import {
    getIO
} from '../socket/index.js';

import {
    authenticateService,
    ApiError
} from '@foodmesh/utils';


const router = Router();

// validate service
router.post("/emit", authenticateService, (req,res)=>{
    
    const {
        event,
        room,
        payload
    } = req.body;

    if(!event || !room){
        throw new ApiError(
            400,
            "Event and room are required"
        );
    }
    const io = getIO();

    console.log(`📶 Emtting event${event} to room ${room}`);

    io.to(room).emit(event, payload??{});

    return res
        .status(200)
        .json(
            200,
            {},
            true
        );
});


export default router;