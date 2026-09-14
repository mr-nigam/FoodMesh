import express from 'express';
import cors from 'cors';
import { errorHandler } from '@foodmesh/utils';
import internalRouter from './routes/internal.js';

const app = express();

/*
==================================================
MIDDLEWARE
==================================================
*/

app.use(
    cors({
        origin: [
            process.env.CLIENT_URL || 'http://localhost:5173',
        ],
        credentials: true,
    })
);

app.use(express.json());

/*
==================================================
ROUTES
==================================================
*/

app.use('/internal', internalRouter);

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

app.use(errorHandler);


export default app;