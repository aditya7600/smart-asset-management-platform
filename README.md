# AssetFlow — Smart Asset Management & Resource Allocation Platform

A full-stack platform for tracking shared inventory, managing bookings, running
approval workflows, and gaining operational visibility — built for the Cultural
Council's pool of cameras, lighting, audio, costumes, props, recording gear and
event infrastructure.

> Submission for **Cult Open Projects 2026 — Smart Asset Management and Resource Allocation Platform**.

---

## ✨ Overview

Organizations rely on shared resources that are easy to lose track of when managed
through spreadsheets and informal chats. AssetFlow replaces that with a single
source of truth:

- **Administrators** manage inventory, review booking requests, issue & return
  assets, and monitor utilization through an analytics dashboard.
- **Users** browse the catalog, check availability, request assets for specific
  dates, and track their borrowing history.

Inventory counts stay correct across the entire asset lifecycle
(request → approve → issue → return), using database transactions to prevent
overbooking.

---

## 🧰 Technology Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, Lucide icons |
| **Backend**  | Node.js, Express, TypeScript, Zod validation |
| **Database** | Prisma ORM with SQLite (zero-config); PostgreSQL-ready |
| **Auth**     | JWT (stateless), bcrypt password hashing, role-based access control |
| **Extras**   | QR code generation (`qrcode`), Helmet, CORS, request logging |
| **DevOps**   | Docker + Docker Compose, nginx (frontend), multi-stage builds |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **npm** (for the local route), **or**
- **Docker + Docker Compose** (for the containerized route).

### Option A — Local development (recommended for the demo)

```bash
# 1. Install dependencies (root tooling + both apps)
npm install                  # root: installs "concurrently" used by `npm run dev`
npm run install:all          # installs server/ and client/ dependencies

# 2. Set up the database (generates Prisma client, creates schema, seeds demo data)
cd server
cp .env.example .env         # the defaults work out of the box (SQLite)
npm run db:setup
cd ..

# 3. Run backend + frontend together
npm run dev
```

> **Tip:** the very first `npm run db:setup` downloads Prisma's database engine.
> On a restricted corporate network this download can be blocked by a TLS proxy —
> if so, run it on a personal/home network, or use the Docker route (Option B).

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:4000** (health check at `/api/health`)

The Vite dev server proxies `/api` to the backend automatically, so no extra
configuration is needed.

> You can also run the two apps separately: `npm run dev:server` and `npm run dev:client`.

### Option B — Docker (one command)

```bash
docker compose up --build
```

Then open **http://localhost:8080**. The backend applies the schema and seeds demo
data automatically on first boot (data persists in a named volume).

---

## 👤 Demo Accounts

The seed script creates ready-to-use accounts (also available via the
"Demo accounts" buttons on the login screen):

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | `admin@assetflow.dev`   | `admin123` |
| User  | `ananya@assetflow.dev`  | `user123`  |
| User  | `rohan@assetflow.dev`   | `user123`  |
| User  | `isha@assetflow.dev`    | `user123`  |

---

## ✅ Feature List

### Core (mandatory)
- **Authentication** — register, login, JWT sessions, role-based routing (Admin / User).
- **Inventory Management** — admins add, edit, delete, and categorize assets; manage quantities, status and condition.
- **Asset Discovery & Booking** — browse, search, filter and sort the catalog; view live availability; request assets for date ranges. Over-booking is blocked.
- **Approval Workflow** — admins review, approve, or reject requests; users track request status.
- **Issue & Return Management** — issue approved bookings, track due dates, record returns; inventory counts update automatically. Overdue loans are flagged.
- **Analytics Dashboard** — summary cards plus bar / pie / line charts (most-used assets, category distribution, utilization, 14-day booking trend).
- **Borrowing History** — users see their full history; admins see system-wide activity.

### Bonus (implemented)
- **In-app Notifications** — real-time bell with unread counts for approvals, rejections, issues and returns.
- **Audit Logs** — every significant action (asset/category/booking lifecycle) is recorded with actor, entity and timestamp.
- **QR Code Operations** — generate a QR code per asset and look assets up by scanned code.
- **Asset Health Tracking** — damage reports & maintenance records with condition/status updates and resolution.
- **Dockerized Deployment** — `docker compose up` brings up the full stack behind nginx.
- **Advanced Analytics** — utilization rates and trend analysis.

---

## 📂 Project Structure

```
.
├── server/                 # Express + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma    # Data model
│   │   └── seed.ts          # Demo data
│   └── src/
│       ├── config/          # Env config
│       ├── lib/             # Prisma client, JWT
│       ├── middleware/      # auth, validation, error handling
│       ├── services/        # audit & notification services
│       ├── modules/         # auth, asset, category, booking, analytics, …
│       ├── utils/           # constants, helpers
│       ├── app.ts           # Express app wiring
│       └── index.ts         # Server entry point
├── client/                 # React + Vite SPA
│   └── src/
│       ├── components/      # UI primitives, layout, shared widgets
│       ├── context/         # Auth context
│       ├── pages/           # Routed pages (+ admin/)
│       ├── lib/             # API client, formatting helpers
│       └── types.ts         # Shared domain types
├── docs/
│   └── DESIGN.md            # Design document (architecture, ERD, schema, API)
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Summary

All endpoints are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header. See [`docs/DESIGN.md`](docs/DESIGN.md) for the
full reference.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Categories | `GET/POST /categories`, `PUT/DELETE /categories/:id` |
| Assets | `GET/POST /assets`, `GET/PUT/DELETE /assets/:id`, `GET /assets/:id/qr`, `GET /assets/lookup/:code` |
| Bookings | `GET/POST /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/{approve,reject,issue,return,cancel}` |
| Analytics | `GET /analytics/{overview,most-used,category-distribution,utilization,bookings-trend}` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Audit | `GET /audit` |
| Maintenance | `GET/POST /maintenance`, `PATCH /maintenance/:id` |

---

## 🗄️ Switching to PostgreSQL

The data layer is fully abstracted via Prisma. To use PostgreSQL:

1. In `server/prisma/schema.prisma`, set `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/assetflow"`.
3. Run `npm run db:setup`.

A ready-to-enable `db` service is included (commented) in `docker-compose.yml`.

---

## 📜 Available Scripts

**Root**
- `npm run install:all` — install both apps
- `npm run db:setup` — set up the database
- `npm run dev` — run backend + frontend concurrently
- `npm run build` — production build of both apps

**Server** (`/server`)
- `npm run dev` · `npm run build` · `npm start`
- `npm run db:setup` · `npm run db:seed` · `npm run db:reset`

**Client** (`/client`)
- `npm run dev` · `npm run build` · `npm run typecheck`

---

## 📄 License

Built for educational purposes as part of Cult Open Projects 2026.
