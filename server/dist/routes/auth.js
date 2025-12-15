"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, phone } = req.body;
        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                phone
            }
        });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT
        const JWT_SECRET = process.env.JWT_SECRET;
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});
// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                isActive: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map