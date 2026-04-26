import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://dynamic-school-bus-route-optimizati-smoky.vercel.app'
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    allowedOrigins.push(...envOrigins);
  }

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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
