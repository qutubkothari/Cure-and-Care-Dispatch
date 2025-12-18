import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (Admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, name, role, phone } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone: phone || null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { email, name, role, phone } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(role && { role }),
        ...(phone !== undefined && { phone })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Toggle user active status (Admin only)
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    // Prevent admin from deactivating themselves
    if (id === user.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password (Admin only)
router.put('/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Failed to reset password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
