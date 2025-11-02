
# KendallSouth Express API (Prisma + JWT)

Backend API ready to deploy on **Render**, **Railway**, **Fly.io**, or any Node host.
Implements:
- `GET /health` → `{ ok: true }`
- `POST /auth/register` → `{ email, password }` → creates user
- `POST /auth/login` → `{ email, password }` → returns `{ token, user }`

Uses **Prisma** with **SQLite** by default. Switch to **Postgres** by setting `DATABASE_URL`.
CORS is configurable via `ALLOWED_ORIGIN` for your Vercel frontend.

---

## Quick Start (local)

```bash
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open: http://localhost:4000/health

### Test with curl
```bash
# Register
curl -X POST http://localhost:4000/auth/register   -H "Content-Type: application/json"   -d '{"email":"manager@floridatrials.org","password":"tucontrasegura123"}'

# Login
curl -X POST http://localhost:4000/auth/login   -H "Content-Type: application/json"   -d '{"email":"manager@floridatrials.org","password":"tucontrasegura123"}'
```

---

## Deploy to Render (recommended)

1. Push this project to a GitHub repo.
2. In Render, create a **Web Service**:
   - Environment: **Node**
   - Build Command: `npm ci && npx prisma generate`
   - Start Command: `npm start`
3. Set Environment Variables:
   - `PORT` = `4000` (or leave empty; Render sets `PORT` automatically)
   - `DATABASE_URL` = (optional Postgres URL; otherwise SQLite is used)
   - `JWT_SECRET` = long random string
   - `ALLOWED_ORIGIN` = `https://YOUR-FRONTEND.vercel.app`
4. Click **Deploy**.

> If using Postgres on Render, add a Render **Postgres** instance and copy its `DATABASE_URL` into the service.

### Deploy to Railway
- Create a new project from GitHub, add a **PostgreSQL** plugin (optional), set env vars (same as above), and deploy.
- Railway also sets `PORT` — the app reads `process.env.PORT` automatically.

---

## Configure your Vite frontend

In your app's **API URL** field, put your deployed backend base URL. Example:

```
https://kendallsouth-api.onrender.com
```

Your frontend will call:
- `POST ${API_URL}/auth/register`
- `POST ${API_URL}/auth/login`

---

## Environment Variables

Copy `.env.example` to `.env` (for local dev):

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-strong-random-secret"
ALLOWED_ORIGIN="http://localhost:5173"
PORT=4000
```

For Postgres:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
```

---

## Notes
- **Security**: This sample returns a simple JWT access token (no refresh). For production, consider HTTPS, rate limiting, and password policies.
- **Runtime**: CommonJS + Express. No TypeScript to keep deployment simple.
