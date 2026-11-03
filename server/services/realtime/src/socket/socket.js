import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/postgre.js';
import {
    subscribe,
    getRiderLocation,
    getOrderTracking
} from '@foodmesh/redis';


let io = null;
let isRedisTrackingSubscribed = false;

const initRedisTrackingBridge = () => {
    if (isRedisTrackingSubscribed) return;

    // 1. Broadcast live location to order tracking rooms
    subscribe({
        channel: 'tracking:location',
        callback: (locationData) => {
            if (io && locationData?.orderId) {
                io.to(`tracking:${locationData.orderId}`).emit('tracking:location', locationData);
                if (locationData.restaurantOrderId) {
                    io.to(`tracking:${locationData.restaurantOrderId}`).emit('tracking:location', locationData);
                }
            }
        }
    });

    // 2. Broadcast lifecycle events (e.g. tracking started, tracking ended)
    subscribe({
        channel: 'tracking:lifecycle',
        callback: (lifecycleData) => {
            if (io && lifecycleData?.orderId) {
                const eventName = lifecycleData.event || 'tracking:ended';
                io.to(`tracking:${lifecycleData.orderId}`).emit(eventName, lifecycleData);
                if (lifecycleData.restaurantOrderId) {
                    io.to(`tracking:${lifecycleData.restaurantOrderId}`).emit(eventName, lifecycleData);
                }
                if (eventName !== 'tracking:ended' && (lifecycleData.status === 'delivered' || lifecycleData.status === 'cancelled')) {
                    io.to(`tracking:${lifecycleData.orderId}`).emit('tracking:ended', lifecycleData);
                    if (lifecycleData.restaurantOrderId) {
                        io.to(`tracking:${lifecycleData.restaurantOrderId}`).emit('tracking:ended', lifecycleData);
                    }
                }
            }
        }
    });

    isRedisTrackingSubscribed = true;
    console.log('📡 Realtime Service subscribed to Redis tracking channels: tracking:location, tracking:lifecycle');
};

// Initialize Socket.IO
const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket', 'polling']
    });

    initRedisTrackingBridge();

    // Socket Authentication Middleware
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                (socket.handshake.auth?.Authorization || socket.handshake.auth?.authorization)?.replace(/^Bearer\s+/i, '') ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

            if(!token){
                return next(
                    new Error('Authentication token required')
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

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

        // User-Specific Room
        socket.join(`user:${userId}`);

        // Connection Confirmation
        socket.emit('connected', {
            success: true,
            message: 'Realtime authentication successful',
            socketId: socket.id,
        });

        // ----------------------------------------------------
        // Order Live Tracking Subscription
        // ----------------------------------------------------
        socket.on('tracking:subscribe', async (data) => {
            const orderId = (typeof data === 'string' ? data : data?.orderId)?.trim();

            if (!orderId) {
                return socket.emit('tracking:error', {
                    message: 'Valid orderId is required for tracking subscription'
                });
            }

            try {
                let isAuthorized = false;
                let assignedRiderId = null;

                // 1. First check Redis tracking order cache (O(1))
                const trackingInfo = await getOrderTracking({ orderId });

                if (trackingInfo) {
                    if (trackingInfo.customerId === userId || socket.user?.role === 'admin') {
                        isAuthorized = true;
                        assignedRiderId = trackingInfo.riderId;
                    }
                }

                // 2. Fallback to PostgreSQL deliveries verification
                if (!isAuthorized) {
                    const query = `
                        SELECT id, order_id, restaurant_order_id, rider_id, user_id, status
                        FROM deliveries
                        WHERE (order_id = $1 OR restaurant_order_id = $1) AND user_id = $2
                        ORDER BY created_at DESC
                        LIMIT 1;
                    `;

                    const { rows } = await pool.query(query, [orderId, userId]);
                    if (rows.length > 0) {
                        isAuthorized = true;
                        assignedRiderId = rows[0].rider_id;
                    } else if (socket.user?.role === 'admin') {
                        isAuthorized = true;
                    }
                }

                if (!isAuthorized) {
                    console.warn(`[Tracking] Unauthorized subscription by user=${userId} for order=${orderId}`);
                    return socket.emit('tracking:error', {
                        orderId,
                        message: 'Unauthorized: You do not own this order'
                    });
                }

                // Join order-specific tracking room
                const room = `tracking:${orderId}`;
                socket.join(room);
                console.log(`📍 Socket ${socket.id} (User ${userId}) joined tracking room: ${room}`);

                socket.emit('tracking:subscribed', {
                    success: true,
                    orderId,
                    room
                });

                // Immediately send latest known location from Redis if available
                if (assignedRiderId) {
                    const latestLocation = await getRiderLocation({ riderId: assignedRiderId });
                    if (latestLocation) {
                        socket.emit('tracking:location', {
                            ...latestLocation,
                            orderId,
                            initial: true
                        });
                    }
                }
            } catch (err) {
                console.error(`[Tracking Subscribe Error] order=${orderId}:`, err.message);
                socket.emit('tracking:error', {
                    orderId,
                    message: 'Failed to subscribe to order tracking'
                });
            }
        });

        // Leave tracking room
        socket.on('tracking:unsubscribe', (data) => {
            const orderId = (typeof data === 'string' ? data : data?.orderId)?.trim();
            if (orderId) {
                const room = `tracking:${orderId}`;
                socket.leave(room);
                console.log(`📍 Socket ${socket.id} left tracking room: ${room}`);
            }
        });

        // Join restaurant room
        socket.on('join:restaurant', (restaurantId) => {
            if (restaurantId) {
                const room = `restaurant:${restaurantId}`;
                socket.join(room);
                console.log(`🏪 Socket ${socket.id} joined restaurant room: ${room}`);
                socket.emit('joined:restaurant', {
                    success: true,
                    restaurantId,
                    room
                });
            }
        });

        // Leave restaurant room
        socket.on('leave:restaurant', (restaurantId) => {
            if (restaurantId) {
                const room = `restaurant:${restaurantId}`;
                socket.leave(room);
                console.log(`🏪 Socket ${socket.id} left restaurant room: ${room}`);
            }
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
    if(!io){
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
