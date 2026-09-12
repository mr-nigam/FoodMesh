import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

// Initialize Socket.IO
const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket', 'polling']
    });

    // Socket Authentication Middleware
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                (socket.handshake.auth?.Authorization || socket.handshake.auth?.authorization)?.replace(/^Bearer\s+/i, '') ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

            console.log(token);

            if(!token){
                return next(
                    new Error('Authentication token required')
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

            console.log(decoded);

            socket.user = {
                ...decoded,
                authenticated: true,
            };

            next();
        } catch (error) {
            console.error(
                '❌ Socket authentication failed:',
                error.message
            );
            next(
                new Error(
                    'Invalid or expired authentication token'
                )
            );
        }
    });

    // Socket Connection
    io.on('connection', (socket) => {
        const userId = socket.user?.id || socket.user?.userId;

        if (!userId) {
            console.error(
                `❌ Socket ${socket.id} authenticated but user ID is missing`
            );
            socket.disconnect(true);
            return;
        }

        console.log(
            `🔌 Socket connected: ${socket.id}, User: ${userId}`
        );

        console.log("Socket room: ", [...socket.rooms]);

        // User-Specific Room
        socket.join(`user:${userId}`);

        // Connection Confirmation
        socket.emit('connected', {
            success: true,
            message: 'Realtime authentication successful',
            socketId: socket.id,
        });

        // Ping/Pong
        socket.on('ping', () => {
            socket.emit('pong', {
                success: true,
                message: 'Socket connection is working',
            });
        });

        // Disconnect
        socket.on('disconnect', (reason) => {
            console.log(
                `🔌 Socket disconnected: ${socket.id}, User: ${userId}, Reason: ${reason}`
            );
        });
    });

    console.log(
        '✅ Socket.IO initialized'
    );

    return io;
};

// Get Socket.IO Instance
const getIO = () => {
    if (!io) {
        throw new Error(
            'Socket.IO has not been initialized. Call initializeSocket(server) first.'
        );
    }
    return io;
};

export {
    initializeSocket,
    getIO,
};