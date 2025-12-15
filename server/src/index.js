const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// In-memory mock data (replace with real DB later)
const deliveries = [
  { id: 'INV-001', driver: 'Rajesh Kumar', status: 'DELIVERED', time: '10:30 AM', location: 'Andheri East' },
  { id: 'INV-002', driver: 'Amit Sharma', status: 'IN_TRANSIT', time: '11:15 AM', location: 'Bandra West' },
  { id: 'INV-003', driver: 'Suresh Patil', status: 'DELIVERED', time: '09:45 AM', location: 'Powai' },
  { id: 'INV-004', driver: 'Vikram Singh', status: 'PENDING', time: '12:00 PM', location: 'Goregaon' },
];

const pettyCash = [
  { id: 'PC-001', driver: 'Rajesh Kumar', amount: 500, status: 'APPROVED', category: 'PETROL', createdAt: new Date() },
];

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cure & Care Dispatch API' });
});

// Deliveries Routes (mocked)
app.get('/api/deliveries', (req, res) => {
  res.json(deliveries);
});

app.post('/api/deliveries', (req, res) => {
  const delivery = { ...req.body, id: `INV-${String(deliveries.length + 1).padStart(3, '0')}` };
  deliveries.unshift(delivery);
  res.json(delivery);
});

app.patch('/api/deliveries/:id/deliver', (req, res) => {
  const idx = deliveries.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Delivery not found' });
  deliveries[idx] = {
    ...deliveries[idx],
    status: 'DELIVERED',
    deliveredAt: new Date().toISOString(),
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    proofImage: req.body.proofImage,
    signature: req.body.signature,
  };
  res.json(deliveries[idx]);
});

// Petty Cash Routes (mocked)
app.get('/api/petty-cash', (req, res) => {
  res.json(pettyCash);
});

app.post('/api/petty-cash', (req, res) => {
  const claim = { ...req.body, id: `PC-${String(pettyCash.length + 1).padStart(3, '0')}`, createdAt: new Date() };
  pettyCash.unshift(claim);
  res.json(claim);
});

app.patch('/api/petty-cash/:id/approve', (req, res) => {
  const idx = pettyCash.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Claim not found' });
  pettyCash[idx] = {
    ...pettyCash[idx],
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
    notes: req.body.notes,
  };
  res.json(pettyCash[idx]);
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});
