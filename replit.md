# Smart Restaurant Management System

## Overview

A full-stack QR code-based restaurant management system built with plain HTML, CSS, and JavaScript (frontend) and Express + PostgreSQL (backend).

## Architecture

```
project-root/
├── backend/              # Express 5 API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic + DB operations
│   │   ├── routes/       # Thin Express routers
│   │   ├── middleware/   # Auth middleware (JWT)
│   │   ├── db/           # Drizzle schema + connection
│   │   ├── validation/   # Zod schemas
│   │   ├── lib/          # Logger
│   │   ├── app.ts        # Express app
│   │   └── index.ts      # Server entry
│   ├── uploads/          # Uploaded images (served at /uploads)
│   ├── build.mjs         # esbuild bundler
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/             # Vanilla HTML/JS static site
│   ├── src/
│   │   ├── pages/        # HTML files (served as routes)
│   │   ├── api/          # Page-specific JS (menu.js, admin.js, etc.)
│   │   └── components/   # Shared JS utilities (auth.js)
│   ├── public/           # Static assets (style.css, favicon, images)
│   ├── server.js         # Node.js static file server + API proxy
│   ├── package.json
│   └── .env.example
│
├── scripts/              # Internal workspace scripts
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── tsconfig.json
```

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: HTML pages, shared CSS, plain browser JavaScript
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **QR codes**: `qrcode` npm package
- **Auth**: `jsonwebtoken` (JWT)
- **File upload**: `multer`

## Pages

- `/` — Landing page with system overview
- `/menu/:tableId` — Customer menu (QR code destination); browse + order; images displayed
- `/order/:orderId` — Order tracking with live status polling
- `/kitchen/login` — Kitchen staff login page
- `/kitchen` — Kitchen dashboard; live order queue with status updates (auth required)
- `/admin/login` — Admin login page
- `/admin` — Admin dashboard with revenue stats and sidebar nav (auth required)
- `/admin/menu` — Menu item management with image upload (auth required)
- `/admin/tables` — Table management with QR code display/download (auth required)
- `/admin/reports` — Paid income reports by day, week, month, or year (auth required)

## Authentication

- JWT-based authentication for admin and kitchen
- Default credentials:
  - Admin: username `admin`, password `admin1234`
  - Kitchen: username `kitchen`, password `kitchen1234`
- Override via env vars: `ADMIN_PASSWORD`, `KITCHEN_PASSWORD`, `JWT_SECRET`
- Tokens stored in localStorage, expire after 24h
- All admin and kitchen pages redirect to login if unauthenticated

## Database Schema

- `menu_categories` — Menu categories (Starters, Mains, Desserts, Beverages)
- `menu_items` — Menu items with price, veg flag, availability, and optional `image_url`
- `restaurant_tables` — Tables with QR code URLs
- `orders` — Customer orders with order status, payment status, subtotal, GST, and total
- `order_items` — Individual items in each order

## Development Setup

### On Replit

The workflow `Start application` runs both services:
```
PORT=8080 pnpm --filter @workspace/backend run dev & PORT=18641 pnpm --filter @workspace/frontend run dev
```

### Locally (or on Render/Railway/Vercel)

1. `pnpm install`
2. Copy and fill in env files:
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Push DB schema: `pnpm --filter @workspace/backend run db:push`
4. `pnpm run dev` — starts both services in parallel

Default ports without env vars:
- Backend: `5000` (set `PORT` in `backend/.env`)
- Frontend: `3000` (set `PORT` in `frontend/.env`)

### Environment Variables

**Backend** (`backend/.env`):
- `PORT` — port to listen on (default `5000`)
- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — JWT signing secret
- `ADMIN_PASSWORD` / `KITCHEN_PASSWORD` — login passwords
- `CLIENT_URL` — frontend origin for CORS (default `http://localhost:3000`)

**Frontend** (`frontend/.env`):
- `PORT` — port to listen on (default `3000`)
- `API_URL` — full URL of the backend API (default `http://localhost:8080`)

## Key Features

- **JWT Authentication**: Separate login for admin and kitchen staff
- **Admin Sidebar Navigation**: Vertical sidebar on desktop, horizontal tab bar on mobile
- **Image Upload**: Admin can upload images for menu items; customers see them on the menu
- **Unified Billing**: New orders from the same table are merged into one active order
- **QR code per table**: Customers scan to access menu
- **Cart with GST**: Real-time subtotal + 18% GST calculation with browser persistence
- **Live order tracking**: Polls every 5 seconds
- **Unpaid order resume banner**: Shows on customer menu for active table bills
- **Kitchen kanban board**: Pending → Received → Preparing → Ready → Delivered
- **Admin stats**: Today's orders, revenue, active orders, table occupancy
- **Paid-only income reports**: Daily, weekly, monthly, yearly
- **Popular items ranking**
- **Menu CRUD**: With availability toggle, veg/non-veg markers, image upload
- **Downloadable QR codes** as PNG files

## Key Commands

```bash
pnpm run typecheck                              # full typecheck
pnpm run build                                  # typecheck + build all
pnpm --filter @workspace/backend run db:push    # push DB schema changes
pnpm --filter @workspace/backend run build      # build backend only
pnpm --filter @workspace/frontend run dev       # run frontend locally
```

## Deployment Notes

- Backend: build with `pnpm --filter @workspace/backend run build`, run with `node backend/dist/index.mjs`
- Frontend: no build step — just `node frontend/server.js`
- The frontend proxies `/api/*` and `/uploads/*` to the backend via `API_URL`
- Uploaded images stored in `backend/uploads/`
