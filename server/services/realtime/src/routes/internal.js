import { Router } from 'express';
import { getIO } from '../socket/socket.js';
import {
    authenticateService,
    ApiError,
    ApiResponse
} from '@foodmesh/utils';


const router = Router();


router.post("/emit", authenticateService, (req, res) => {
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

    console.log(`📶 Emitting event "${event}" to room "${room}"`);

    io.to(room).emit(event, payload ?? {});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { event, room },
                "Event emitted successfully"
            )
        );
});


export default router;