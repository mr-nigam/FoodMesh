// services/realtime/src/app.js

import express from 'express';
import cors from 'cors';


const app = express();


/*
==================================================
MIDDLEWARE
==================================================
*/

app.use(
    cors({
        origin: [
            'http://localhost:5173',
        ],
        credentials: true,
    })
);

app.use(express.json());


/*
==================================================
HEALTH CHECK
==================================================
*/

app.get('/health', (req, res) => {

    res.status(200).json({
        success: true,
        service: 'realtime-service',
        status: 'healthy',
    });

});


export default app;