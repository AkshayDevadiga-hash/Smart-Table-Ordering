# Smart Restaurant Management System

## Overview

A full-stack QR code-based restaurant management system built with plain HTML, CSS, and JavaScript (frontend) and Express + PostgreSQL (backend).

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript at `/` — customer menu, order tracking, kitchen dashboard, admin panel
- **Backend**: Express 5 API server at `/api`
- **Database**: PostgreSQL + Drizzle ORM

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: HTML pages, shared CSS, plain browser JavaScript
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
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
- The workflow `Start application` runs both services via:
  - `PORT=8080 pnpm --filter @workspace/api-server run dev`
  - `PORT=18641 pnpm --filter @workspace/restaurant run dev`

### Locally (or on Render/Railway/Vercel)
1. `pnpm install`
2. Copy env examples and fill in values:
   - `cp artifacts/api-server/.env.example artifacts/api-server/.env`
   - `cp artifacts/restaurant/.env.example artifacts/restaurant/.env`
3. `pnpm run dev` — starts both services in parallel

Default ports without env vars:
- API server: `5000` (set `PORT` in `artifacts/api-server/.env`)
- Frontend: `3000` (set `PORT` in `artifacts/restaurant/.env`)

### Environment Variables
**API server** (`artifacts/api-server/.env`):
- `PORT` — port to listen on (default `5000`)
- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — JWT signing secret
- `ADMIN_PASSWORD` / `KITCHEN_PASSWORD` — login passwords
- `CLIENT_URL` — frontend origin for CORS (default `http://localhost:3000`)

**Frontend** (`artifacts/restaurant/.env`):
- `PORT` — port to listen on (default `3000`)
- `API_URL` — full URL of the API server (default `http://localhost:5000`)

### Other notes
- The frontend proxies `/api/*` and `/uploads/*` requests to the API server via `API_URL`.
- Frontend files live under `artifacts/restaurant/public/`:
  - HTML pages: `index.html`, `menu.html`, `order.html`, `kitchen.html`, `kitchen-login.html`, `admin.html`, `admin-login.html`, `admin-menu.html`, `admin-tables.html`, `admin-reports.html`
  - CSS: `style.css` (includes admin sidebar layout + mobile nav styles)
  - JavaScript: `public/js/*.js`, `public/js/auth.js` (shared auth utilities)
- Uploaded images stored at `artifacts/api-server/uploads/`, served at `/uploads/`

## Key Features

- **JWT Authentication**: Separate login for admin and kitchen staff
- **Admin Sidebar Navigation**: Vertical sidebar on desktop, horizontal tab bar on mobile
- **Image Upload**: Admin can upload images for menu items; customers see them on the menu
- **Unified Billing**: New orders from the same table are merged into one active order instead of creating duplicates
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

## Deployment Setup

- Production build command builds the API server and runs the no-op frontend build.
- Production run command starts the API server on internal port `8080` and the restaurant frontend on the incoming app port.
- The incoming/public port is `18641`; do not use `8080` as the public port because that is only for the internal API proxy.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
