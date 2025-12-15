# Complete Documentation: Cure & Care Dispatch System

## 🚀 Features Implemented

### ✅ Database (PostgreSQL + Prisma)
- Complete schema with 8 models
- User management (Admin/Driver roles)
- Delivery tracking with proof of delivery
- Petty cash management with approval workflow
- GPS location history
- WhatsApp notification logs
- Real-time delivery tracking

### ✅ Authentication (JWT)
- Secure login/register with bcrypt
- JWT token-based authentication
- Role-based access control (Admin/Driver)
- Protected API routes
- Token refresh mechanism

### ✅ Live GPS Tracking
- Real-time driver location updates
- Location history with timestamps
- Accuracy, speed, and heading data
- Live map view for admins
- Route tracking for deliveries

### ✅ WhatsApp Notifications (Twilio)
- Delivery assigned alerts
- Delivery status updates
- Petty cash approval/rejection
- Customer delivery notifications
- Bulk notification support

### ✅ Photo Uploads (Cloudinary)
- Delivery proof photos
- Receipt uploads for petty cash
- Automatic image optimization
- Secure cloud storage
- Multiple image upload support

### ✅ Real-time Updates (WebSocket)
- Live delivery status changes
- Driver location broadcasting
- Petty cash submissions
- Admin dashboard live updates
- Driver app live notifications

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Twilio account (for WhatsApp)
- Cloudinary account (for image uploads)

### Setup Steps

1. **Clone and install dependencies**
   ```powershell
   git clone <your-repo>
   cd Cure-and-Care-Dispatch
   .\setup.ps1
   ```

2. **Configure environment variables**

   **Server (.env)**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dispatch"
   JWT_SECRET="your-secret-key-min-32-characters"
   JWT_EXPIRES_IN="7d"
   
   # Twilio WhatsApp
   TWILIO_ACCOUNT_SID="your-twilio-sid"
   TWILIO_AUTH_TOKEN="your-twilio-token"
   TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

   **Client (.env)**:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Setup database**
   ```powershell
   cd server
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Create admin user**
   ```powershell
   npx tsx scripts/createAdmin.ts
   ```

5. **Run development servers**

   Terminal 1 (Server):
   ```powershell
   cd server
   npm run dev
   ```

   Terminal 2 (Client):
   ```powershell
   cd client
   npm run dev
   ```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user

### Deliveries
- `GET /api/deliveries` - Get all deliveries (with filters)
- `GET /api/deliveries/:id` - Get single delivery
- `POST /api/deliveries` - Create delivery (Admin only)
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/assign` - Assign to driver (Admin only)
- `DELETE /api/deliveries/:id` - Delete delivery (Admin only)

### Petty Cash
- `GET /api/petty-cash` - Get all entries (with filters)
- `POST /api/petty-cash` - Create entry
- `PUT /api/petty-cash/:id/status` - Approve/reject (Admin only)
- `GET /api/petty-cash/stats` - Get statistics

### GPS Tracking
- `POST /api/tracking/location` - Update driver location
- `GET /api/tracking/location/:driverId` - Get location history
- `GET /api/tracking/locations/live` - Get all live locations (Admin only)
- `GET /api/tracking/delivery/:deliveryId` - Get delivery tracking

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image

---

## 🌐 WebSocket Events

### Client → Server
- `join-driver` - Join driver-specific room
- `join-admin` - Join admin room
- `location-update` - Send location update

### Server → Client
- `new-delivery` - New delivery assigned
- `delivery-updated` - Delivery status changed
- `driver-location` - Driver location update
- `petty-cash-submitted` - New petty cash entry
- `petty-cash-updated` - Petty cash status changed

---

## 🧪 Testing Guide

### 1. Test Authentication
```bash
# Register admin
POST http://localhost:3000/api/auth/register
{
  "email": "admin@cure.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "ADMIN",
  "phone": "+919876543210"
}

# Login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@cure.com",
  "password": "admin123"
}
# Save the token for next requests
```

### 2. Test Delivery Flow
```bash
# Create delivery
POST http://localhost:3000/api/deliveries
Authorization: Bearer <token>
{
  "invoiceNumber": "INV-001",
  "customerName": "Test Customer",
  "customerPhone": "+919876543210",
  "address": "123 Test Street, Mumbai",
  "driverId": "<driver-user-id>"
}

# Update status to DELIVERED
PUT http://localhost:3000/api/deliveries/<id>/status
Authorization: Bearer <token>
{
  "status": "DELIVERED",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "proofImage": "<cloudinary-url>",
  "notes": "Delivered successfully"
}
```

### 3. Test GPS Tracking
```bash
# Send location update
POST http://localhost:3000/api/tracking/location
Authorization: Bearer <driver-token>
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "accuracy": 10,
  "speed": 45,
  "heading": 180
}

# Get live locations
GET http://localhost:3000/api/tracking/locations/live
Authorization: Bearer <admin-token>
```

### 4. Test Photo Upload
```bash
# Upload delivery proof
POST http://localhost:3000/api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
{
  "image": <file>,
  "type": "delivery"
}
```

### 5. Test Petty Cash
```bash
# Create entry
POST http://localhost:3000/api/petty-cash
Authorization: Bearer <driver-token>
{
  "amount": 500,
  "category": "PETROL",
  "description": "Fuel for deliveries",
  "receiptUrl": "<cloudinary-url>"
}

# Approve/Reject
PUT http://localhost:3000/api/petty-cash/<id>/status
Authorization: Bearer <admin-token>
{
  "status": "APPROVED",
  "notes": "Approved for reimbursement"
}
```

---

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token expiration (7 days default)
- Role-based access control
- Protected API routes
- CORS configuration
- SQL injection prevention (Prisma)
- Image validation (type and size limits)

---

## 📱 Mobile Features

### GPS Location Tracking
- Uses browser Geolocation API
- Background location updates
- Accurate positioning with fallback

### Camera Integration
- Take photo for delivery proof
- Upload receipt images
- Preview before upload

### PWA Capabilities
- Offline support (coming soon)
- Push notifications
- Install as app

---

## 🚀 Deployment

### Production Build
```powershell
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build

# Start production
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=<production-postgres-url>
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://your-domain.com
```

---

## 📊 Database Schema

### Users
- id, email, password, name, phone, role, isActive

### Deliveries
- id, invoiceNumber, customer info, address, status, GPS coordinates, proof, driver assignment

### PettyCash
- id, amount, category, description, receipt, status, approvals

### DriverLocation
- id, driverId, GPS data (lat/lng/accuracy/speed/heading), timestamp

### DeliveryTracking
- id, deliveryId, status updates, GPS breadcrumbs

### Notifications
- id, recipient, message, type, status, delivery reference

---

## 🆘 Troubleshooting

### Database connection fails
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run: `npx prisma db push` to sync schema

### WhatsApp not sending
- Verify Twilio credentials
- Check phone number format (+country code)
- Ensure Twilio WhatsApp sandbox is configured

### Images not uploading
- Check Cloudinary credentials
- Verify file size < 5MB
- Ensure image format is supported

### WebSocket not connecting
- Check CORS settings
- Verify client VITE_API_URL
- Check firewall/proxy settings

---

## 📞 Support

For issues or questions:
1. Check the documentation above
2. Review error logs in console
3. Test with Postman/Thunder Client
4. Check database with: `npx prisma studio`

---

**Happy Dispatching! 🚚💚**
