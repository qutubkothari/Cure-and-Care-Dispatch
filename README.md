# Cure & Care Dispatch

Enterprise-grade Dispatch Recording System (PWA + admin dashboard) with a backend API, in-house Postgres DB, and a WhatsApp assistant service.

## Local development

### Prereqs (Windows)

- Install Docker Desktop (so `docker` + `docker compose` work)
- Node.js 20+ (npm workspaces)

### 1) Start the database

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
docker compose up -d
```

Or run everything with the helper script (recommended):

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
./scripts/local-up.ps1
```

### 2) Configure env

- API: copy `apps/api/.env.example` to `apps/api/.env`
- Assistant: copy `apps/assistant/.env.example` to `apps/assistant/.env`

### 3) Install dependencies

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
npm install
```

### 4) Initialize DB schema (Prisma)

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
```

### 5) Run everything

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
npm run dev
```

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`
- API docs: `http://localhost:4000/docs`
- Assistant health: `http://localhost:4100/health`

## EC2 hosting (target)

- Recommended: run services as Docker containers behind an ALB/Nginx reverse proxy.
- This repo includes `docker-compose.ec2.yml` for an “in-house” Postgres on the same EC2 instance.

### EC2 quick start (Docker Compose)

1) Copy `.env.ec2.example` to `.env.ec2` and set `JWT_SECRET` (and later your domain).
2) Run:

```bash
./scripts/ec2/up.sh
```

### Windows one-command deploy to EC2

1) Edit `deploy.ec2.json`:
	- Set `gitRepoUrl`
	- Set a strong `jwtSecret`
	- Confirm `user` (usually `ubuntu`) and `appDir`
2) Run:

```powershell
cd "c:\Users\musta\OneDrive\Documents\GitHub\Cure and Care Dispatch"
./scripts/deploy-ec2.ps1
```

This deploy script also:
- Creates swap on EC2 (adds RAM safety to avoid hangs)
- Clears Docker build cache + drops Linux page cache (optional; enabled by default in `deploy.ec2.json`)

WhatsApp provider details will be plugged into `apps/assistant` once you share the API spec.
