import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5174', 'http://localhost:5173','https://dynamic-school-bus-route-optimizati-smoky.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a specific room based on bus ID for targeted updates
    socket.on('join_bus_room', (busId: string) => {
      socket.join(`bus_${busId}`);
      console.log(`Socket ${socket.id} joined room: bus_${busId}`);
    });

    socket.on('leave_bus_room', (busId: string) => {
      socket.leave(`bus_${busId}`);
      console.log(`Socket ${socket.id} left room: bus_${busId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
