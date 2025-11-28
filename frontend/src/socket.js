import { io } from 'socket.io-client';

let socket = null;

export function initSocket(backendUrl, userId) {
    if (!backendUrl) return null;
    if (socket) {
        // if already connected and same user, do nothing
        try {
            if (socket.connected && socket.userId === userId) return socket;
        } catch (e) { /* ignore */ }
    }

    // close previous socket if user changed
    if (socket && socket.connected) {
        try { socket.disconnect(); } catch (e) { /* ignore */ }
    }

    // create new socket
    socket = io(backendUrl, { withCredentials: true });
    socket.userId = userId;

    socket.on('connect', () => {
        // join user-specific room if userId provided
        if (userId) {
            socket.emit('join', userId);
        }
    });

    socket.on('connect_error', (err) => {
        console.warn('Socket connect error', err);
    });

    return socket;
}

export function getSocket() {
    return socket;
}
