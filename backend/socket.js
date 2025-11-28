import { Server } from 'socket.io';

let io = null;

export function initSocket(server) {
    if (io) return io;
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL, 'http://localhost:5173', 'http://localhost:5176'],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        // optional: could join rooms, etc.
        console.log('Socket connected:', socket.id);
        socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
    });

    return io;
}

export function getIO() {
    return io;
}
