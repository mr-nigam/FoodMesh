import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './context';
import useAppData from './useAppData.js';
import { realtimeService } from '../config/constants.js';

const SOCKET_URL =
    import.meta.env.VITE_REALTIME_URL || realtimeService;

const SocketProvider = ({ children }) => {
    const { isAuth, user } = useAppData();
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken');

        if (!isAuth || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        if (socketRef.current?.connected) return;

        const newSocket = io(SOCKET_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log(
                '🔌 Connected to realtime service:',
                newSocket.id
            );
        });

        newSocket.on('connected', (data) => {
            console.log(
                '✅ Realtime authentication successful:',
                data
            );
        });

        newSocket.on('connect_error', (error) => {
            // Only warn if connection attempt failed and socket is actively trying to reconnect
            if (newSocket.active) {
                console.warn(
                    '⚠️ Socket connection error (reconnecting):',
                    error.message
                );
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log(
                '🔌 Disconnected from realtime service:',
                reason
            );
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            if (socketRef.current === newSocket) {
                socketRef.current = null;
            }
            setSocket(null);
        };
    }, [isAuth, user?.id]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketProvider };
export default SocketProvider;