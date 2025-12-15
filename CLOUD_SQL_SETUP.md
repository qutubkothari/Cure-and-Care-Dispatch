# Quick Setup: Cloud SQL PostgreSQL with App Engine

## 🎯 Goal
Host PostgreSQL database on Google Cloud SQL and connect it to your App Engine app.

---

## 📋 Step-by-Step Setup

### **1. Create Cloud SQL PostgreSQL Instance**

```powershell
# Run the automated setup script
.\setup-cloudsql.ps1
```

This script will:
- ✅ Create Cloud SQL PostgreSQL instance (db-f1-micro, free tier eligible)
- ✅ Create database named "dispatch"
- ✅ Create database user with secure password
- ✅ Update app.yaml with connection details
- ✅ Generate JWT secrets
- ✅ Create local .env file

**⚠️ IMPORTANT: Save the database password shown in the output!**

---

### **2. Install Cloud SQL Proxy (for local development)**

Download Cloud SQL Proxy:
```powershell
# Download
Invoke-WebRequest -Uri "https://dl.google.com/cloudsql/cloud_sql_proxy_x64.exe" -OutFile "cloud_sql_proxy.exe"

# Run (replace CONNECTION_NAME from script output)
.\cloud_sql_proxy.exe -instances=care-and-cure-dispatch:us-central1:dispatch-db=tcp:5432
```

Keep this running in a terminal while developing locally.

---

### **3. Run Database Migrations**

```powershell
cd server

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Or for development with migration history
npx prisma migrate dev --name init
```

---

### **4. Create Admin User**

```powershell
# Still in server directory
npx tsx scripts/createAdmin.ts
```

Enter:
- Email: `admin@cure.com`
- Password: `admin123` (or your choice)
- Name: `Admin User`
- Phone: `+919876543210`

---

### **5. Test Locally**

```powershell
# Terminal 1: Cloud SQL Proxy (keep running)
.\cloud_sql_proxy.exe -instances=care-and-cure-dispatch:us-central1:dispatch-db=tcp:5432

# Terminal 2: Server
cd server
npm install
npm run dev

# Terminal 3: Client
cd client
npm install
npm run dev
```

Open http://localhost:5173 and login!

---

### **6. Deploy to App Engine**

```powershell
# Make sure app.yaml has DATABASE_URL configured
# (setup-cloudsql.ps1 already did this)

# Commit changes
git add -A
git commit -m "Setup Cloud SQL database"
git push origin main

# Deploy
gcloud app deploy app.yaml --quiet
```

---

## 🔒 Security Notes

### **App Engine connects via Unix Socket**
- No public IP needed (more secure)
- Connection string format: `postgresql://USER:PASS@/DB?host=/cloudsql/CONNECTION_NAME`
- Already configured in app.yaml by setup script

### **Local Development via Cloud SQL Proxy**
- Secure tunnel to Cloud SQL
- Connection string: `postgresql://USER:PASS@localhost:5432/DB`
- Already configured in server/.env

---

## 💰 Cost Estimate

**Cloud SQL db-f1-micro (Free Tier Eligible)**:
- Shared CPU, 0.6GB RAM
- 10GB storage included
- ~$7-10/month if exceeding free tier
- Perfect for development/small production

**App Engine**:
- F2 instance: ~$0.10/hour when running
- Auto-scales to 0 when no traffic (cost = $0)

---

## 🔧 Troubleshooting

### "Connection refused" error locally
- ✅ Check Cloud SQL Proxy is running
- ✅ Verify connection name matches
- ✅ Check DATABASE_URL in server/.env

### "Connection timeout" on App Engine
- ✅ Verify DATABASE_URL in app.yaml uses Unix socket format
- ✅ Check Cloud SQL instance is running: `gcloud sql instances list`
- ✅ Ensure VPC connector is created (if using)

### "Role does not exist" error
- ✅ Run the user creation command from setup-cloudsql.ps1 output
- ✅ Check username matches in DATABASE_URL

### Prisma migration fails
- ✅ Make sure Cloud SQL Proxy is running (local)
- ✅ Check DATABASE_URL is correct
- ✅ Verify user has CREATE permissions

---

## 📊 Useful Commands

```powershell
# Check Cloud SQL instances
gcloud sql instances list

# Connect to database via psql
gcloud sql connect dispatch-db --user=dispatch_user --database=dispatch

# View database logs
gcloud sql operations list --instance=dispatch-db

# Check App Engine logs
gcloud app logs tail

# View Prisma schema in browser
cd server
npx prisma studio
```

---

## 🚀 What's Next?

After setup is complete:
1. ✅ Configure Twilio (WhatsApp) credentials in app.yaml
2. ✅ Configure Cloudinary (image upload) credentials in app.yaml
3. ✅ Test all features locally
4. ✅ Deploy to production
5. ✅ Monitor with Google Cloud Console

---

**Your database is now hosted on Google Cloud and ready to use! 🎉**
