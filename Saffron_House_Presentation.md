# Saffron House — Smart Restaurant Management System
### Project Presentation Guide

---

## Slide 1 — Title Slide

**Saffron House**
*Smart Restaurant Management System*

> QR-code-based ordering — from table to kitchen to payment, fully digital.

**Presented by:** [Your Name]
**Project Type:** Full-Stack Web Application

---

## Slide 2 — The Problem

**Why does this exist?**

Restaurants face real operational friction every day:

- Waiters manually taking orders leads to mistakes and delays
- Kitchen staff have no real-time visibility into incoming orders
- Customers are left waiting without knowing their order status
- Cash payments go untracked and waiter calls go unanswered
- Paper-based processes create bottlenecks during peak hours

> **The result:** Slower service, unhappy customers, revenue lost.

---

## Slide 3 — Our Solution

**One QR code. Zero friction.**

Customers scan a table-specific QR code and get instant access to a full digital menu — no app download required. They browse, order, track, and pay entirely from their phone.

Staff manage everything through purpose-built dashboards:

| Role | Dashboard |
|------|-----------|
| Kitchen Staff | Live order Kanban board |
| Admin | Full management console |

> From table to kitchen to payment — the entire restaurant workflow is digitised.

---

## Slide 4 — Customer Journey

**How it works for the customer — step by step:**

```
Scan QR Code on table
        ↓
Browse menu by category (Veg / Non-Veg filters)
        ↓
Add items to cart (with special instructions)
        ↓
Place order
        ↓
Track order status in real-time
  [ Pending → Received → Preparing → Ready → Delivered ]
        ↓
Pay — UPI / Card / Cash
        ↓
Leave a review & rating
```

**Key highlights:**
- No app installation needed — works in any mobile browser
- Session-isolated: each table visit is independent
- 18% GST auto-calculated at checkout
- Live status updates every 5 seconds (auto-refresh)

---

## Slide 5 — Kitchen Dashboard

**What the kitchen sees:**

A real-time Kanban-style order board that shows every active order in the restaurant.

| Column | Orders shown |
|--------|-------------|
| Pending | Just placed, awaiting acknowledgement |
| Preparing | Kitchen is actively cooking |
| Ready | Food ready for pickup/delivery |
| Delivered | Completed orders |

**Features:**
- Kitchen staff tap one button to move an order to the next status
- Auto-refreshes every few seconds — no manual page reloads
- Shows table number, items, quantities, and special instructions
- Marks orders as delivered to close the loop

---

## Slide 6 — Admin Dashboard

**Full restaurant control in one place.**

### Live Stats (real-time)
- Orders placed today
- Revenue earned today
- Number of active tables

### Menu Management
- Add, edit, and delete menu categories
- Add items with names, prices, images, Veg/Non-Veg tags, and availability toggle

### Table Management
- Add tables with capacity settings
- Auto-generates a unique QR code per table
- Download QR as PNG — print and place on the physical table

### Reports & Analytics
- Revenue breakdown: daily, weekly, monthly, yearly
- Popular items report — most ordered dishes
- Table-wise revenue tracking

### Notification System
- Waiter request alerts (assistance + cash collection)
- Acknowledge and resolve requests from the dashboard

---

## Slide 7 — Tech Stack

**Built with modern, production-grade technology.**

### Frontend
| Layer | Technology |
|-------|-----------|
| Language | Vanilla HTML5 / CSS3 / JavaScript (ES6+) |
| Styling | Custom CSS with CSS variables (design tokens) |
| QR Codes | `qrcode` npm library |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js 5 (latest) |
| Language | TypeScript |
| ORM | Drizzle ORM (type-safe SQL) |
| Validation | Zod (runtime schema validation) |
| Auth | JWT — JSON Web Tokens |
| Logging | Pino (structured JSON logs) |
| Build | esbuild (single `.mjs` bundle) |

### Database
- **PostgreSQL** — hosted on Replit's managed database
- Migrations managed via Drizzle Kit

### Architecture
- **Monorepo** with pnpm workspaces: `@workspace/backend` and `@workspace/frontend`
- Backend on port **8080**, Frontend served on port **5000**

---

## Slide 8 — System Architecture

**How the pieces connect:**

```
Customer's Phone
      │  (HTTP / fetch API)
      ▼
  Frontend Server (port 5000)
  ├── /menu/:tableId       → Customer ordering UI
  ├── /admin               → Admin dashboard
  ├── /admin-menu          → Menu management
  ├── /admin-tables        → Table management
  ├── /admin-reports       → Reports & analytics
  ├── /admin-reviews       → Customer reviews
  └── /kitchen             → Kitchen Kanban board
      │
      │  (REST API calls)
      ▼
  Backend API Server (port 8080)
  ├── /api/auth            → Login (JWT)
  ├── /api/menu/*          → Menu items & categories
  ├── /api/orders/*        → Order lifecycle
  ├── /api/kitchen/*       → Kitchen-specific queries
  ├── /api/admin/*         → Stats & reports
  ├── /api/tables/*        → Table management
  ├── /api/waiter-requests → Staff notifications
  └── /api/qr              → QR code generation
      │
      ▼
  PostgreSQL Database
  ├── menu_categories
  ├── menu_items
  ├── restaurant_tables
  ├── orders
  ├── order_items
  ├── reviews
  └── waiter_requests
```

### Database Schema Summary

| Table | Key Fields |
|-------|-----------|
| `menu_categories` | id, name, description, sort_order |
| `menu_items` | id, category_id, name, price, image_url, is_available, is_veg |
| `restaurant_tables` | id, table_number, capacity, status, qr_code |
| `orders` | id, table_id, session_id, status, payment_status, payment_method, subtotal, tax, total |
| `order_items` | id, order_id, menu_item_id, quantity, unit_price |
| `reviews` | id, order_id, rating, comment |
| `waiter_requests` | id, table_id, order_id, type, status, note |

---

## Slide 9 — Standout Features

**What makes Saffron House unique:**

### 1. Hybrid Cash Payment Flow
A two-step verified cash payment system:
1. Customer taps "Request Cash Collection" in the app
2. A waiter request is created and sent to the admin dashboard
3. Staff physically collect cash and confirm in the dashboard
4. Order is automatically marked as **Paid**

No cash goes untracked. No order closes without confirmation.

### 2. Digital Waiter Call with Cooldown
- Customer taps "Call Waiter" from their order page
- Request is sent to the admin notification system
- A 60-second cooldown prevents repeat spam
- Status shown live in the customer UI

### 3. QR Code Generation & Download
- Every table gets a unique URL: `/menu/:tableId`
- Admin generates a PNG QR code in one click
- Download, print, and laminate — no setup needed

### 4. Session-Isolated Ordering
- Each table visit generates a `session_id`
- Customers only see their own orders — not previous visits
- Multiple concurrent customers on the same table are isolated

### 5. Auto-calculated Taxes
- 18% GST applied automatically at checkout
- Subtotal, tax, and total displayed separately
- Stored per order for accurate reporting

### 6. Customer Review System
- After delivery, customers rate their experience (1–5 stars)
- Leave a text comment
- Admin can filter and view all reviews with date, table, and order details

---

## Slide 10 — Closing Slide

**Saffron House**
*A complete, production-ready restaurant management system.*

---

**What we built:**
- Full end-to-end digital ordering system
- Three distinct user-facing dashboards (Customer, Kitchen, Admin)
- 15+ REST API endpoints with JWT authentication
- Real-time order tracking and staff notifications
- Complete payment flow including cash verification

**Impact:**
- Faster service, zero paper menus
- Kitchen gets orders the moment they're placed
- Admin has full business visibility at a glance
- Customers stay informed throughout their meal

---

> *"From table to kitchen to payment — fully digital, fully connected."*

---

**Thank you.**

[Your Name] | [Institution / Course] | [Date]
