import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cure & Care Dispatch API' });
});

// Deliveries Routes
app.get('/api/deliveries', async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: { driver: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

app.post('/api/deliveries', async (req, res) => {
  try {
    const delivery = await prisma.delivery.create({
      data: req.body
    });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

app.patch('/api/deliveries/:id/deliver', async (req, res) => {
  try {
    const { latitude, longitude, proofImage, signature } = req.body;
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: {
        status: 'DELIVERED',
        latitude,
        longitude,
        proofImage,
        signature,
        deliveredAt: new Date()
      }
    });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// Petty Cash Routes
app.get('/api/petty-cash', async (req, res) => {
  try {
    const pettyCash = await prisma.pettyCash.findMany({
      include: { driver: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pettyCash);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch petty cash' });
  }
});

app.post('/api/petty-cash', async (req, res) => {
  try {
    const pettyCash = await prisma.pettyCash.create({
      data: req.body
    });
    res.json(pettyCash);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create petty cash claim' });
  }
});

app.patch('/api/petty-cash/:id/approve', async (req, res) => {
  try {
    const pettyCash = await prisma.pettyCash.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        notes: req.body.notes
      }
    });
    res.json(pettyCash);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve petty cash' });
  }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});
