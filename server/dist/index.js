"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const deliveries_1 = __importDefault(require("./routes/deliveries"));
const pettyCash_1 = __importDefault(require("./routes/pettyCash"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const upload_1 = __importDefault(require("./routes/upload"));
const audit_1 = __importDefault(require("./routes/audit"));
const reports_1 = __importDefault(require("./routes/reports"));
const users_1 = __importDefault(require("./routes/users"));
const auth_2 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
(0, dotenv_1.config)();
try {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
        const parsed = new URL(databaseUrl);
        console.log('DB config:', {
            host: parsed.host,
            database: parsed.pathname,
            socketHost: parsed.searchParams.get('host')
        });
    }
    else {
        console.warn('DB config: DATABASE_URL is not set');
    }
}
catch (error) {
    console.error('DB config: failed to parse DATABASE_URL', {
        message: error?.message,
        stack: error?.stack
    });
}
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Make io accessible in routes
app.set('io', io);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public routes
app.use('/api/auth', auth_1.default);
// Protected routes
app.use('/api/deliveries', auth_2.authenticateToken, deliveries_1.default);
app.use('/api/petty-cash', auth_2.authenticateToken, pettyCash_1.default);
app.use('/api/tracking', auth_2.authenticateToken, tracking_1.default);
app.use('/api/upload', auth_2.authenticateToken, upload_1.default);
app.use('/api/audit', auth_2.authenticateToken, audit_1.default);
app.use('/api/reports', auth_2.authenticateToken, reports_1.default);
app.use('/api/users', auth_2.authenticateToken, users_1.default);
// WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-driver', (driverId) => {
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
app.use(errorHandler_1.errorHandler);
// For production: serve static React files
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express_1.default.static(path.join(__dirname, '../../client/dist')));
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
}
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
//# sourceMappingURL=index.js.map