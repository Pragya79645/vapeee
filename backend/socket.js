import { Server } from 'socket.io';

let io = null;

export function initSocket(server) {
    if (io) return io;
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL, 'https://www.knightstvapeshop.ca', 'http://localhost:5173', 'http://localhost:5176'],
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        // optional: could join rooms, etc.
        console.log('Socket connected:', socket.id);

        // allow clients to join a room for their userId so we can emit user-specific events
        socket.on('join', (userId) => {
            try {
                if (!userId) return;
                const room = `user:${userId}`;
                socket.join(room);
                console.log(`Socket ${socket.id} joined room ${room}`);
            } catch (e) {
                console.error('Join room error', e);
            }
        });

        socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
    });

    return io;
}

export function getIO() {
    return io;
}
