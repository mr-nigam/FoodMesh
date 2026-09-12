import '@foodmesh/utils/config/env';

import http from 'http';

import app from './app.js';
import bootstrapDB from './bootstrap/db.bootstrap.js';
import { initializeSocket } from './socket/socket.js';


const startServer = async () => {

    try {

        /*
        |--------------------------------------------------------------------------
        | Database
        |--------------------------------------------------------------------------
        */

        await bootstrapDB();

        /*
        |--------------------------------------------------------------------------
        | HTTP Server
        |--------------------------------------------------------------------------
        */

        const PORT = Number(process.env.REALTIME_PORT) || 4009;

        const server = http.createServer(app);

        /*
        |--------------------------------------------------------------------------
        | Socket.IO
        |--------------------------------------------------------------------------
        */

        initializeSocket(server);

        /*
        |--------------------------------------------------------------------------
        | Start Server
        |--------------------------------------------------------------------------
        */

        server.listen(PORT, () => {

            console.log(
                `🚀 Realtime Server running on port ${PORT}`
            );

        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use by another process.`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });

        /*
        |--------------------------------------------------------------------------
        | Graceful Shutdown
        |--------------------------------------------------------------------------
        */

        const shutdown = async (signal) => {
            console.log(
                `\n🛑 ${signal} received. Shutting down Realtime Server...`
            );

            server.close(async () => {
                console.log(
                    '✅ HTTP server closed.'
                );
                process.exit(0);
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.once('SIGUSR2', () => {
            server.close(() => {
                process.kill(process.pid, 'SIGUSR2');
            });
        });

    } catch (error) {

        console.error(
            '❌ Failed to start Realtime Server:',
            error
        );

        process.exit(1);
    }
};


startServer();