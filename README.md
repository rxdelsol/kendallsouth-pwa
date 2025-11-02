
# Kendall South — API Starter (Next.js App Router + Prisma)

This drop-in API adds working `/api/auth/login`, `/api/auth/register`, and `/api/health` routes to your Next.js app.
It uses Prisma with SQLite by default and can switch to Postgres by setting `DATABASE_URL`.

## Quick Start (same project as your frontend)
1) Copy the `app`, `lib`, and `prisma` folders into your Next.js repo (or merge with existing ones).
2) Install deps:
   ```bash
   npm i @prisma/client prisma bcryptjs jsonwebtoken zod
   # or: pnpm add ... / yarn add ...
   ```
3) Initialize DB (SQLite by default):
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4) Create `.env` from `.env.example` and set `JWT_SECRET`. For Postgres, set `DATABASE_URL` to your connection string.
5) Deploy to Vercel. These routes will be served under `/api/*` on your same domain.

## Endpoints
- `GET /api/health` → `{ ok: true }`
- `POST /api/auth/register` → body `{ email, password }` → creates user (409 if exists)
- `POST /api/auth/login` → body `{ email, password }` → returns `{ token, user }`

## CORS
If your API runs on a different domain than the frontend, set `ALLOWED_ORIGIN` in the environment. Otherwise (same domain), CORS is not needed.

## Notes
- Runtime is `nodejs` (Prisma is not supported on the edge).
- Tokens are signed with `JWT_SECRET`. For production, consider rotating secrets and adding refresh tokens.
