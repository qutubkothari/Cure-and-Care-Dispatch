import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/deliveries';
import pettyCashRoutes from './routes/pettyCash';
import trackingRoutes from './routes/tracking';
import uploadRoutes from './routes/upload';
import auditRoutes from './routes/audit';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

config();

try {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const parsed = new URL(databaseUrl);
    console.log('DB config:', {
      host: parsed.host,
      database: parsed.pathname,
      socketHost: parsed.searchParams.get('host')
    });
  } else {
    console.warn('DB config: DATABASE_URL is not set');
  }
} catch (error) {
  console.error('DB config: failed to parse DATABASE_URL', {
    message: (error as any)?.message,
    stack: (error as any)?.stack
  });
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/deliveries', authenticateToken, deliveryRoutes);
app.use('/api/petty-cash', authenticateToken, pettyCashRoutes);
app.use('/api/tracking', authenticateToken, trackingRoutes);
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-driver', (driverId: string) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined room`);
  });

  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('Admin joined room');
  });

  socket.on('location-update', (data) => {
    // Broadcast location to admin room
    socket.to('admin').emit('driver-location', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// For production: serve static React files
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

export { io };
