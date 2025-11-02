# Provider Credential Tracker — Auth Server (JWT)
Multi-user backend with email+password login and protected credentials API.

## Setup
```bash
npm install
cp .env.example .env  # on Windows: copy .env.example .env
# edit .env: set JWT_SECRET and (optional) ADMIN_* to seed first admin
npm start
```
Server runs on `PORT` (default 8080), DB file `pct_auth.db` in working dir.

## API
- `POST /auth/login` → { email, password }
- `GET  /auth/me` (Bearer token)
- `POST /auth/register` (admin only) → { email, name, password, role? }
- `GET  /api/creds` (Bearer)
- `POST /api/creds` (Bearer)
- `PUT  /api/creds/:id` (Bearer)
- `DELETE /api/creds/:id` (Bearer)
