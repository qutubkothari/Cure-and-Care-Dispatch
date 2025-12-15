# Cure & Care Dispatch - Professional Delivery Tracking System

## 🎨 **Beautiful Enterprise-Grade UI**
- Lemon-green and light-green professional branding
- Responsive design for all devices
- PWA-ready for mobile drivers
- Real-time GPS tracking
- Offline-first architecture

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)

### 1. Install Dependencies
```powershell
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Configure Database
Edit `server/.env` with your PostgreSQL connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dispatch_db"
```

### 3. Start Application
```powershell
# Terminal 1: Frontend (already running)
cd client
npm run dev

# Terminal 2: Backend
cd server
npm run db:push    # Create database tables
npm run dev        # Start API server
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 👥 **Demo Accounts**

### Admin Dashboard
- Email: `admin@cure.com`
- Password: `admin123`
- Access: Full system control, delivery tracking, petty cash approval

### Driver App  
- Email: `driver@cure.com`
- Password: `driver123`
- Access: Mobile-optimized, delivery recording, GPS capture

## 📱 **Features**

### Admin Dashboard
- ✅ Live delivery tracking with GPS
- ✅ Real-time driver status
- ✅ Petty cash approval system
- ✅ Excel export for accounting
- ✅ Complete audit trail
- ✅ Performance analytics

### Driver PWA
- ✅ One-tap delivery confirmation
- ✅ Automatic GPS + timestamp capture
- ✅ Photo/signature proof of delivery
- ✅ Petty cash claims with evidence
- ✅ Offline mode with auto-sync
- ✅ Simple, non-technical interface

## 🗄️ **Database Schema**

### Users
- ID, email, password, name, role (ADMIN/DRIVER/MANAGER)
- Phone, active status, timestamps

### Deliveries
- Invoice number, customer details, address
- Status (PENDING/IN_TRANSIT/DELIVERED/CANCELLED)
- GPS coordinates, delivery proof
- Driver assignment, timestamps

### Petty Cash
- Amount, category (PETROL/TOLL/PARKING/etc.)
- GPS + timestamp, receipt photo/video
- Approval status, notes
- Driver reference, audit trail

## 🛠️ **Tech Stack**

### Frontend
- **React 19** with TypeScript
- **Vite** for blazing fast dev experience
- **TailwindCSS v3** for beautiful styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide Icons** for professional icons

### Backend
- **Express.js** - Fast API server
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Reliable production database
- **JWT** - Secure authentication
- **TypeScript** - Type safety

## 📦 **Deployment**

### Option 1: Google Cloud Run (Recommended)
```powershell
# Deploy frontend
cd client
gcloud run deploy cure-care-web --source . --region=asia-south1

# Deploy backend
cd server
gcloud run deploy cure-care-api --source . --region=asia-south1
```

### Option 2: Vercel + Railway
- Frontend → Vercel (automatic Next.js/Vite detection)
- Backend → Railway (automatic Express detection)
- Database → Railway PostgreSQL or Neon

### Option 3: Traditional VPS
- Upload code to EC2/DigitalOcean
- Install PostgreSQL
- Run with PM2 for process management

## 🔒 **Security**
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- SQL injection protection via Prisma

## 📊 **API Endpoints**

```
GET    /health              - Health check
GET    /api/deliveries      - List all deliveries
POST   /api/deliveries      - Create new delivery
PATCH  /api/deliveries/:id/deliver - Mark as delivered
GET    /api/petty-cash      - List all petty cash claims
POST   /api/petty-cash      - Create new claim
PATCH  /api/petty-cash/:id/approve - Approve claim
```

## 🎯 **Benefits**

✅ **Zero Paperwork** - Fully digital workflow
✅ **Fraud Resistant** - GPS + timestamp on every action  
✅ **Fast Reconciliation** - Hours reduced to minutes
✅ **Reliable Proof** - Photo/signature evidence
✅ **Simple UX** - Designed for non-technical drivers
✅ **Real-time Visibility** - Live tracking dashboard
✅ **Cost Effective** - No app store fees (PWA)
✅ **Offline Support** - Works without internet

## 📞 **Support**

For issues or questions:
1. Check the console for error messages
2. Verify PostgreSQL is running
3. Ensure ports 5173 and 4000 are available
4. Check `.env` configuration

---

**© 2025 Cure & Care. Built with ❤️ for efficient delivery management.**
