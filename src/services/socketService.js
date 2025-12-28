import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let socket;

const socketService = {
    connect: (token) => {
        if (socket) return socket;

        socket = io(SOCKET_URL, {
            auth: {
                token
            },
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket Server');
        });

        socket.on('connect_error', (err) => {
            console.error('❌ WebSocket Connection Error:', err.message);
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => {
        return socket;
    },

    // Helper to subscribe to events
    on: (eventName, callback) => {
        if (socket) {
            socket.on(eventName, callback);
        }
    },

    off: (eventName) => {
        if (socket) {
            socket.off(eventName);
        }
    }
};

export default socketService;
