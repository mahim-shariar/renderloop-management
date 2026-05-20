# RenderLoop — Video Editing Agency Management

Production-ready management dashboard tailored to a video editing studio. Monorepo with a React frontend and a Node/Express + MongoDB backend.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Redux Toolkit + RTK Query, React Router v6, framer-motion, lucide-react, recharts, react-hook-form + zod, @dnd-kit, react-big-calendar, react-player, sonner.
- **Backend**: Node.js, Express, MongoDB + Mongoose, JWT (httpOnly cookies), bcryptjs, express-validator, multer (thumbnails only).
- **Note**: this system does **not** host raw video files. Editors paste links to Frame.io / Google Drive / Dropbox / WeTransfer / YouTube. Only URLs and small thumbnails are stored.

## Folder Structure

```
./
├── frontend/   React + Vite app
├── server/     Express + MongoDB API
├── package.json   root, runs both via concurrently
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js >= 18 (tested on 20.x)
- npm >= 9
- A MongoDB instance (local `mongod` or MongoDB Atlas connection string)

## Setup

```bash
# 1. Install every package in one go (root + frontend + server)
npm run install:all

# 2. Copy env templates and fill them in
cp server/.env.example server/.env
cp frontend/.env.example frontend/.env

# 3. Start both apps
npm run dev
```

Frontend runs on http://localhost:5173, server on http://localhost:5000.

## Environment Variables

### `server/.env`
| Key | Description |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin for CORS, e.g. `http://localhost:5173` |
| `NODE_ENV` | `development` or `production` |

### `frontend/.env`
| Key | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api` |

## Scripts (root)

| Command | Action |
| --- | --- |
| `npm run dev` | Start both server and frontend in parallel |
| `npm run dev:frontend` | Frontend only |
| `npm run dev:server` | Server only |
| `npm run install:all` | Install root + workspace deps |
| `npm run build` | Build frontend for production |
| `npm start` | Run server in production mode |

## Deployment — both on Vercel

Deploy as **two separate Vercel projects** from the same GitHub repo: one for the
server (`server/`) and one for the frontend (`frontend/`). The config files
(`server/vercel.json`, `server/api/index.js`, `frontend/vercel.json`) are already
in the repo.

### 1. Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Network Access → Add IP** — add `0.0.0.0/0` (Vercel functions have no fixed IP).
3. **Database Access** — create a user; copy the `mongodb+srv://...` string and append
   a db name: `mongodb+srv://user:pass@cluster.mongodb.net/renderloop`.

### 2. Server — Vercel project #1
The Express app runs as a serverless function (`server/api/index.js`); `server/vercel.json`
routes all requests to it and registers a daily notification-sweep cron.

- **New Project** → import the repo → set **Root Directory = `server`**
- Framework preset: **Other** (Vercel auto-detects the `api/` function)
- Environment variables:
  | Key | Value |
  | --- | --- |
  | `NODE_ENV` | `production` |
  | `MONGO_URI` | your Atlas connection string |
  | `JWT_SECRET` | a long random string |
  | `JWT_EXPIRES_IN` | `7d` |
  | `CLIENT_URL` | the frontend's Vercel URL (set after step 3) |
  | `CRON_SECRET` | a random string — Vercel sends it to the sweep cron |
  | `ENCRYPTION_KEY` | optional; falls back to `JWT_SECRET` |
- Deploy → note the URL, e.g. `https://renderloop-api.vercel.app`
- Seed the first admin: run `npm --prefix server run seed:reset` **locally** against the
  same `MONGO_URI` (Vercel has no shell). Login: `admin@renderloop.com` / `admin12345`.

### 3. Frontend — Vercel project #2
- **New Project** → same repo → set **Root Directory = `frontend`**
- Framework preset: **Vite** (build `npm run build`, output `dist`)
- Environment variable: `VITE_API_URL` = `https://<your-server-project>.vercel.app/api`
- Deploy → copy this URL back into the **server** project's `CLIENT_URL` env and redeploy
  the server so CORS allows it.

### Notes
- Auth cookies use `sameSite=none; secure` in production — both projects are HTTPS on
  Vercel, so cross-site cookies work. `CLIENT_URL` must be the exact frontend origin.
- The notification sweep runs via **Vercel Cron** (`server/vercel.json` → daily). On the
  Hobby plan crons trigger about once a day; upgrade for a higher frequency.
- Serverless cold starts reconnect to Mongo on the first request (~1–2s); the connection
  is cached for subsequent warm invocations.

## Production notes

- All API responses follow `{ success, message?, data?, code?, details? }`; HTTP status codes are used correctly (200/201/400/401/403/404/409/500).
- Money is stored as integer **cents** everywhere; format only at the UI boundary.
- `payoutDetails` for team members is encrypted at rest (AES-256-GCM).
- Frontend routes are code-split; tables export to CSV; a top-level `ErrorBoundary` catches render failures.

## Auth (Phase 2)

JWT is issued via an **httpOnly cookie** named `rl_session`. CORS is configured with `credentials: true`, so frontend requests must use `credentials: 'include'` (RTK Query handles this in Phase 3).

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | Email + password → sets `rl_session` cookie |
| GET | `/api/auth/me` | authenticated | Returns the current user |
| POST | `/api/auth/logout` | public | Clears the cookie |
| POST | `/api/auth/register` | admin only | Invites a new user (admin/manager/editor/client) |

Roles: `admin | manager | editor | client`. Use `authMiddleware` + `roleMiddleware(...allowed)` to gate routes.

### Seed users

After setting `MONGO_URI` in `server/.env`, populate sample accounts:

```bash
npm --prefix server run seed
```

Creates:
- `admin@renderloop.local` / `admin12345` (admin)
- `manager@renderloop.local` / `manager12345`
- `eli@renderloop.local` / `editor12345`
- `priya@renderloop.local` / `editor12345`

## Roadmap

Built incrementally in phases — all complete:

1. ✅ Scaffolding & tooling
2. ✅ Backend foundation & auth
3. ✅ Frontend foundation (layout, theming, UI primitives)
4. ✅ Clients module
5. ✅ Projects (Kanban + table + drafts/revisions)
6. ✅ Team (editors & specialists)
7. ✅ Finance (income / expenses / payouts / invoices)
8. ✅ Tasks, Calendar, Notifications
9. ✅ Overview dashboard & analytics
10. ✅ Polish & production-readiness
