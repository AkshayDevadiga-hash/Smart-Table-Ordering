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

## Pages

- `/` — Landing page with system overview
- `/menu/:tableId` — Customer menu (QR code destination); browse + order
- `/order/:orderId` — Order tracking with live status polling
- `/kitchen` — Kitchen dashboard; live order queue with status updates
- `/admin` — Admin dashboard with revenue stats
- `/admin/menu` — Menu item management (CRUD)
- `/admin/tables` — Table management with QR code display/download

## Database Schema

- `menu_categories` — Menu categories (Starters, Mains, Desserts, Beverages)
- `menu_items` — Menu items with price, veg flag, availability
- `restaurant_tables` — Tables with QR code URLs
- `orders` — Customer orders with status tracking
- `order_items` — Individual items in each order

## Development Setup

- The Replit workflow named `Start application` runs both services:
  - API server on port `8080`
  - Restaurant frontend on port `18641`
- The frontend proxies `/api/*` requests to the API server.
- The development database is provisioned and the Drizzle schema has been pushed.
- Starter data has been seeded for 4 menu categories, 9 menu items, and 5 restaurant tables.
- Frontend files live under `artifacts/restaurant/public/`:
  - HTML pages: `index.html`, `menu.html`, `order.html`, `kitchen.html`, `admin.html`, `admin-menu.html`, `admin-tables.html`
  - CSS: `style.css`
  - JavaScript: `public/js/*.js`
- The old React/Vite frontend source has been removed from `artifacts/restaurant`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- QR code per table, customers scan to access menu
- Cart with real-time subtotal + 5% GST calculation
- Live order tracking (polls every 5 seconds)
- Kitchen kanban board: Pending → Received → Preparing → Ready → Delivered
- Admin stats: today's orders, revenue, active orders, table occupancy
- Popular items ranking
- Menu CRUD with availability toggle and veg/non-veg markers
- Downloadable QR codes as PNG files
