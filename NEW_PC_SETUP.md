# Cure & Care Dispatch - New PC Setup Guide

**Last Updated:** January 1, 2026  
**Production URL:** https://care-and-cure-dispatch.uc.r.appspot.com  
**GitHub Repository:** https://github.com/qutubkothari/Cure-and-Care-Dispatch

---

## 📋 Project Overview

**Cure & Care Dispatch** is a comprehensive delivery tracking and management system with real-time features, built for healthcare/pharmaceutical delivery operations.

### Tech Stack

#### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Key Libraries:**
  - Axios (API calls)
  - Socket.IO Client (real-time updates)
  - Lucide React (icons)
  - jsPDF + jsPDF-AutoTable (PDF reports)
  - html2canvas (screenshot/export)

#### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express 5.2.1
- **Database:** PostgreSQL (Cloud SQL)
- **ORM:** Prisma
- **Authentication:** JWT
- **Real-time:** Socket.IO

#### Deployment
- **Platform:** Google App Engine (Standard Environment)
- **Database:** Cloud SQL PostgreSQL (us-central1)
- **Project ID:** care-and-cure-dispatch
- **Region:** us-central1

---

## 🚀 Quick Start on New PC

### 1. Prerequisites

Install the following on your new PC:

- **Node.js 20.x** (https://nodejs.org/)
- **Git** (https://git-scm.com/)
- **Google Cloud SDK** (https://cloud.google.com/sdk/docs/install)
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense

### 2. Clone Repository

```bash
git clone https://github.com/qutubkothari/Cure-and-Care-Dispatch.git
cd Cure-and-Care-Dispatch
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 4. Google Cloud Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project care-and-cure-dispatch

# Verify
gcloud config list
```

---

## 🔐 Environment Configuration

### Production Environment Variables (app.yaml)

The project uses **app.yaml** for production config (already configured):

```yaml
env_variables:
  NODE_ENV: "production"
  DATABASE_URL: "postgresql://dispatch_user:yXDnjmPGCoew2W3RtBib@localhost:5432/dispatch?host=/cloudsql/care-and-cure-dispatch:us-central1:dispatch-db"
  JWT_SECRET: "x1RgkTWDmCqrGLYob7QhZ48w6cjKOXBe"
  JWT_EXPIRES_IN: "7d"
  CORS_ORIGIN: "*"
```

### Local Development (Optional)

If you want to run locally, create `server/.env`:

```env
NODE_ENV=development
DATABASE_URL=postgresql://dispatch_user:PASSWORD@localhost:5432/dispatch
JWT_SECRET=x1RgkTWDmCqrGLYob7QhZ48w6cjKOXBe
JWT_EXPIRES_IN=7d
PORT=3000
```

⚠️ **Note:** Local development requires Cloud SQL Proxy or local PostgreSQL instance.

---

## 🗄️ Database Information

### Production Database
- **Instance:** care-and-cure-dispatch:us-central1:dispatch-db
- **Database Name:** dispatch
- **User:** dispatch_user
- **Connection:** Via Cloud SQL Unix Socket (automatically handled in production)

### Schema Management
- **Tool:** Prisma
- **Schema Location:** `server/prisma/schema.prisma`
- **Migrations:** `server/prisma/migrations/`

### Current Database Tables
- `users` - System users (admin, drivers)
- `deliveries` - Delivery records
- `tracking_updates` - Delivery status updates
- `petty_cash_entries` - Petty cash requests
- `audit_logs` - System audit trail

---

## 📦 Project Structure

```
Cure-and-Care-Dispatch/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components (AdminDashboard, DriverDashboard, Login)
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API & Socket.IO clients
│   │   ├── App.tsx           # Main app with routing
│   │   └── index.css         # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/           # API routes (auth, deliveries, etc.)
│   │   ├── services/         # Business logic
│   │   ├── index.ts          # Server entry point
│   │   └── server.ts         # Express app configuration
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   ├── repairMigrations.js   # Migration repair helper
│   ├── migrateLegacyUsers.js # Legacy user migration
│   └── package.json
│
├── scripts/                   # Utility scripts
├── app.yaml                   # Google App Engine config
├── deploy.ps1                 # Deployment script
├── smoke-live.ps1            # Production smoke tests
├── package.json              # Root package.json
└── NEW_PC_SETUP.md           # This file
```

---

## 🎨 Key Features Implemented

### Admin Dashboard
- ✅ Delivery management (create, edit, delete, assign drivers)
- ✅ Real-time delivery tracking with live updates
- ✅ Driver management (add, edit, activate/deactivate)
- ✅ Petty cash approval workflow
- ✅ Live tracking map view
- ✅ Reports & Analytics (PDF/CSV export)
- ✅ Audit logs viewer
- ✅ Bulk import deliveries (CSV)
- ✅ Sync status indicator

### Driver Dashboard
- ✅ View assigned deliveries
- ✅ Update delivery status with location tracking
- ✅ Petty cash request submission
- ✅ Delivery history
- ✅ Real-time notifications

### Authentication & Security
- ✅ JWT-based authentication
- ✅ Role-based access control (ADMIN, DRIVER)
- ✅ Password reset functionality
- ✅ Session management
- ✅ Protected routes

### Real-time Features
- ✅ Socket.IO for live updates
- ✅ Delivery status changes broadcast
- ✅ Live driver location tracking
- ✅ Instant dashboard updates

---

## 🔨 Development Workflow

### Building the Project

```bash
# Build client only
cd client
npm run build

# Build server only
cd server
npm run build

# Build everything (from root)
npm run build
```

### Deploying to Production

```powershell
# Using the automated script (PowerShell)
.\deploy.ps1
```

**What deploy.ps1 does:**
1. Commits any uncommitted changes
2. Pushes to GitHub
3. Deploys to Google App Engine
4. Shows deployment URL

### Running Smoke Tests

```powershell
# Test production site
.\smoke-live.ps1

# Test with authentication (deep QC)
.\smoke-live.ps1 -AdminEmail "admin@cure.com" -AdminPassword "admin123" -DriverEmail "driver@cure.com" -DriverPassword "driver123"
```

---

## 👥 Default User Accounts

### Admin Account
- **Email:** admin@cure.com
- **Password:** admin123
- **Role:** ADMIN

### Driver Account
- **Email:** driver@cure.com
- **Password:** driver123
- **Role:** DRIVER

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Deployment Fails
```bash
# Check project configuration
gcloud config list

# Verify authentication
gcloud auth list

# Check app.yaml syntax
cat app.yaml
```

#### 2. Database Connection Issues
- Ensure Cloud SQL instance is running
- Check DATABASE_URL format in app.yaml
- Verify migration status: `cd server && npx prisma migrate status`

#### 3. Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm install
cd client && npm install
cd ../server && npm install
```

#### 4. Assets Not Loading (404)
- Hard refresh browser: `Ctrl + F5`
- Check app.yaml static handlers
- Verify client build completed: `ls client/dist/assets/`

---

## 📊 Monitoring & Logs

### View Production Logs

```powershell
# View recent logs
.\logs-recent.ps1

# View error logs only
.\logs-errors.ps1

# View stderr logs
.\logs-stderr.ps1 -Limit 80

# View logs in Google Cloud Console
gcloud app logs tail -s default
```

### Live Site Monitoring
- **Production URL:** https://care-and-cure-dispatch.uc.r.appspot.com
- **Health Check:** https://care-and-cure-dispatch.uc.r.appspot.com/health

---

## 🎯 Recent Fixes & Updates (Dec 18, 2025 - Jan 1, 2026)

1. **Fixed Static Asset 404 Issues**
   - Corrected app.yaml handlers for Vite assets
   - Fixed SPA fallback routing

2. **Fixed Authentication**
   - Implemented real login flow
   - Added route guards
   - Fixed client API baseURL

3. **Database Schema Alignment**
   - Migrated from legacy schema to new schema
   - Fixed table name mappings
   - Added migration repair logic

4. **UI Polish**
   - Fixed button colors (Reports, User Management, Audit Logs)
   - Removed global CSS overrides
   - Standardized green/primary theme

5. **Driver Management**
   - Fixed empty drivers list
   - Wired "Add Driver" button
   - Load drivers from `/api/users`

---

## 🔄 Git Workflow

### Current Branch
- **main** - Production-ready code (auto-deployed)

### Making Changes

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# Deploy (if using deploy.ps1, it handles git automatically)
```

---

## 📝 Important Files

### Configuration
- `app.yaml` - App Engine configuration
- `client/vite.config.ts` - Vite build config
- `server/prisma/schema.prisma` - Database schema

### Deployment
- `deploy.ps1` - Main deployment script
- `smoke-live.ps1` - Production testing script

### Documentation
- `README.md` - General project readme
- `SRS — Dispatch App.txt` - Software Requirements Specification
- `IMPLEMENTATION_GUIDE.md` - Implementation details
- `CLOUD_SQL_SETUP.md` - Database setup guide

---

## 🚦 Next Steps on New PC

1. ✅ Clone repository
2. ✅ Install dependencies (`npm install` in root, client, server)
3. ✅ Setup Google Cloud SDK and authenticate
4. ✅ Verify you can access production: https://care-and-cure-dispatch.uc.r.appspot.com
5. ✅ Run smoke tests: `.\smoke-live.ps1`
6. ✅ Make a test change and deploy: `.\deploy.ps1`

---

## 🆘 Support & Resources

### Documentation
- **Prisma Docs:** https://www.prisma.io/docs
- **App Engine Docs:** https://cloud.google.com/appengine/docs/standard/nodejs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev

### Repository
- **GitHub:** https://github.com/qutubkothari/Cure-and-Care-Dispatch
- **Issues:** Report in GitHub Issues

---

## ✅ Pre-Migration Checklist

Before leaving old PC:
- [x] All code committed and pushed to GitHub
- [x] Documentation updated (NEW_PC_SETUP.md created)
- [x] Production deployment verified
- [x] Google Cloud credentials backed up
- [x] Database credentials documented

On new PC:
- [ ] Clone repository
- [ ] Install Node.js 20.x
- [ ] Install Google Cloud SDK
- [ ] Authenticate with Google Cloud
- [ ] Install dependencies
- [ ] Run smoke tests
- [ ] Deploy test change

---

**You're all set!** 🎉

Everything is pushed to GitHub. Just clone the repository on your new PC and follow the Quick Start section above.

For any issues, refer to the Troubleshooting section or check the existing PowerShell scripts in the repository.

Good luck with your new setup!
