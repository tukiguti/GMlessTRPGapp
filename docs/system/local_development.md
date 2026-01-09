# Local Development Guide

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` (or `.env.local` if you prefer, but check your tools support it).
   ```bash
   cp .env.example .env
   ```

3. **Start Database & Redis**
   ```bash
   npm run docker:up
   ```
   This starts PostgreSQL on port 5432 and Redis on port 6379.

## Running the App

### Full Stack (Client + Server + DB)
```bash
npm run dev:full
```

### Individual Components
- **Server**: `npm run dev:server`
- **Client**: `npm run dev:client`

## Database Management
- **Prisma Studio**: `npx prisma studio` (View/Edit data)
- **Migration**: `npx prisma migrate dev` (Apply schema changes)

## Troubleshooting
- **Port Conflicts**: Ensure ports 3000 (Client), 4000 (Server), 5432 (Postgres), 6379 (Redis) are free.
- **Database Connection**: Check `docker ps` to see if containers are running.
