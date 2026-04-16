# Smart Restaurant Ordering System — Technical Guide

## Overview

The Smart Restaurant Ordering System is a QR-code-based digital ordering platform for restaurants. Customers scan a QR code at their table, browse the menu, and place orders — all without involving a waiter. Kitchen staff see incoming orders on a live dashboard, and admins manage the full menu and table setup through a separate panel.

---

## 1. Technology Stack

### Frontend
- **Language:** Plain HTML5, CSS3, and Vanilla JavaScript (no React or any frontend framework)
- **Pages are server-rendered** — each page is a separate `.html` file served by Node.js
- **Styling:** Custom CSS written per-page (no Tailwind or UI library on the customer-facing pages)

### Backend
- **Language:** TypeScript (compiled to JavaScript)
- **Runtime:** Node.js (v24)
- **Framework:** Express.js v5
- **Build Tool:** esbuild — bundles all TypeScript into a single `dist/index.mjs` file
- **Logging:** Pino (structured JSON logging)
- **Validation:** Zod — every incoming request is validated before hitting the database

### Database
- **Type:** PostgreSQL (relational SQL database — NOT MongoDB)
- **ORM:** Drizzle ORM — defines tables as TypeScript schemas and generates type-safe queries
- **Migrations:** `drizzle-kit push` — syncs the schema to the database automatically

### Authentication
- **Method:** JWT (JSON Web Tokens) — stored in cookies
- **Roles:** `admin` and `kitchen` — each has its own login page and protected routes
- **No customer login** — customers access the menu via a QR code URL containing their table ID

### Image Uploads
- **Library:** Multer — handles `multipart/form-data` file uploads
- **Storage:** Files are saved to `artifacts/api-server/uploads/` on disk
- **Access:** The backend serves the uploads folder as a static path at `/uploads`

---

## 2. Project Structure

```
workspace/
├── artifacts/
│   ├── api-server/           # The backend Express API
│   │   ├── src/
│   │   │   ├── index.ts      # Entry point — reads PORT, starts server
│   │   │   ├── app.ts        # Configures Express, middleware, static uploads
│   │   │   ├── routes/
│   │   │   │   ├── index.ts          # Mounts all route groups
│   │   │   │   ├── auth.ts           # POST /api/auth/login, /logout, /me
│   │   │   │   ├── menu.ts           # CRUD for categories and items, image upload
│   │   │   │   ├── orders.ts         # Create, list, update orders
│   │   │   │   ├── tables.ts         # CRUD for restaurant tables + QR generation
│   │   │   │   ├── kitchen.ts        # Kitchen-specific order view routes
│   │   │   │   ├── admin.ts          # Admin-specific routes
│   │   │   │   └── health.ts         # GET /api/health — liveness check
│   │   │   └── lib/
│   │   │       └── logger.ts         # Pino logger setup
│   │   ├── uploads/          # Uploaded menu item images stored here
│   │   ├── build.mjs         # esbuild script that compiles src/ → dist/
│   │   └── dist/             # Compiled output (generated, do not edit)
│   │
│   └── restaurant/           # The customer/kitchen/admin frontend
│       ├── server.js         # Node.js HTTP server — serves HTML and proxies /api
│       └── public/
│           ├── index.html            # Landing page
│           ├── menu.html             # Customer menu (loaded via QR code)
│           ├── order.html            # Customer order tracking
│           ├── kitchen.html          # Kitchen order dashboard
│           ├── kitchen-login.html    # Kitchen login
│           ├── admin.html            # Admin home
│           ├── admin-login.html      # Admin login
│           ├── admin-menu.html       # Manage menu items and categories
│           ├── admin-tables.html     # Manage tables and generate QR codes
│           ├── admin-reports.html    # Order reports
│           └── js/
│               ├── menu.js           # Customer menu logic
│               ├── order.js          # Order tracking logic
│               ├── kitchen.js        # Kitchen dashboard logic
│               ├── admin.js          # Admin home logic
│               ├── admin-menu.js     # Menu management logic
│               ├── admin-tables.js   # Table management logic
│               └── admin-reports.js  # Reports logic
│
└── lib/
    ├── db/                   # Shared database layer
    │   ├── src/
    │   │   ├── index.ts      # Creates and exports the Drizzle DB instance
    │   │   └── schema/
    │   │       └── restaurant.ts  # All table definitions (schema)
    │   └── drizzle.config.ts # Drizzle Kit configuration
    │
    ├── api-spec/             # OpenAPI spec (openapi.yaml) + code generation
    ├── api-zod/              # Auto-generated Zod schemas for request validation
    └── api-client-react/     # Auto-generated React Query hooks (used in sandbox)
```

---

## 3. Database Design

The database is PostgreSQL. Tables are defined using Drizzle ORM in `lib/db/src/schema/restaurant.ts`.

### Tables

#### `menu_categories`
Stores the groupings that menu items belong to (e.g. Starters, Mains, Desserts, Beverages).

| Column       | Type      | Description                        |
|--------------|-----------|------------------------------------|
| id           | serial    | Auto-incrementing primary key      |
| name         | text      | Category name (e.g. "Starters")    |
| description  | text      | Optional description               |
| sort_order   | integer   | Controls display order             |
| created_at   | timestamp | Auto-set on insert                 |

#### `menu_items`
Stores each dish or drink available to order.

| Column       | Type      | Description                                        |
|--------------|-----------|----------------------------------------------------|
| id           | serial    | Auto-incrementing primary key                      |
| category_id  | integer   | Foreign key → menu_categories.id (cascade delete)  |
| name         | text      | Item name                                          |
| description  | text      | Optional description                               |
| price        | decimal   | Price with 2 decimal places                        |
| image_url    | text      | Path like `/uploads/filename.jpg`, or null         |
| is_available | boolean   | Whether item appears on the customer menu          |
| is_veg       | boolean   | Marks vegetarian items                             |
| sort_order   | integer   | Controls display order within a category           |
| created_at   | timestamp | Auto-set on insert                                 |

#### `restaurant_tables`
One row per physical table in the restaurant.

| Column        | Type      | Description                                        |
|---------------|-----------|----------------------------------------------------|
| id            | serial    | Auto-incrementing primary key                      |
| table_number  | integer   | Unique table number                                |
| capacity      | integer   | Number of seats                                    |
| status        | enum      | `available`, `occupied`, or `reserved`             |
| qr_code       | text      | QR code data (the URL for this table's menu)       |
| created_at    | timestamp | Auto-set on insert                                 |

#### `orders`
One row per order placed by a table.

| Column               | Type      | Description                                                                 |
|----------------------|-----------|-----------------------------------------------------------------------------|
| id                   | serial    | Auto-incrementing primary key                                               |
| table_id             | integer   | Foreign key → restaurant_tables.id                                          |
| status               | enum      | `pending` → `received` → `preparing` → `ready` → `delivered` → `completed` |
| payment_status       | enum      | `pending` or `paid`                                                         |
| subtotal             | decimal   | Sum of item prices                                                          |
| tax                  | decimal   | Tax amount                                                                  |
| total                | decimal   | subtotal + tax                                                              |
| special_instructions | text      | Any notes from the customer                                                 |
| created_at           | timestamp | When order was placed                                                       |
| updated_at           | timestamp | Last status change                                                          |

#### `order_items`
Each row is one line item within an order.

| Column               | Type    | Description                                          |
|----------------------|---------|------------------------------------------------------|
| id                   | serial  | Auto-incrementing primary key                        |
| order_id             | integer | Foreign key → orders.id (cascade delete)             |
| menu_item_id         | integer | Foreign key → menu_items.id                          |
| menu_item_name       | text    | Snapshot of the item name at time of order           |
| quantity             | integer | How many of this item                                |
| unit_price           | decimal | Price per unit at time of order                      |
| special_instructions | text    | Per-item notes from the customer                     |

### Data Relationships

```
menu_categories
    └── menu_items (many items per category)

restaurant_tables
    └── orders (many orders per table over time)
            └── order_items (many items per order)
                    └── references menu_items
```

---

## 4. API Endpoints

All API routes are prefixed with `/api`.

### Authentication — `/api/auth`
| Method | Path              | Description                          | Auth Required |
|--------|-------------------|--------------------------------------|---------------|
| POST   | /auth/login       | Login as admin or kitchen            | No            |
| POST   | /auth/logout      | Clear auth cookie                    | Yes           |
| GET    | /auth/me          | Get current logged-in user info      | Yes           |

### Menu — `/api/menu`
| Method | Path                        | Description                      | Auth Required |
|--------|-----------------------------|----------------------------------|---------------|
| GET    | /menu/categories            | List all categories              | No            |
| POST   | /menu/categories            | Create a category                | Admin         |
| PUT    | /menu/categories/:id        | Update a category                | Admin         |
| DELETE | /menu/categories/:id        | Delete a category                | Admin         |
| GET    | /menu/items                 | List items (filter by category)  | No            |
| POST   | /menu/items                 | Create a menu item               | Admin         |
| PUT    | /menu/items/:id             | Update a menu item               | Admin         |
| DELETE | /menu/items/:id             | Delete a menu item               | Admin         |
| POST   | /menu/upload                | Upload an image, returns URL     | Admin         |

### Orders — `/api/orders`
| Method | Path              | Description                          | Auth Required |
|--------|-------------------|--------------------------------------|---------------|
| GET    | /orders           | List all orders                      | Kitchen/Admin |
| POST   | /orders           | Place a new order (customer)         | No            |
| GET    | /orders/:id       | Get a single order with items        | No            |
| PUT    | /orders/:id       | Update order status or payment       | Kitchen/Admin |

### Tables — `/api/tables`
| Method | Path              | Description                          | Auth Required |
|--------|-------------------|--------------------------------------|---------------|
| GET    | /tables           | List all tables                      | Admin         |
| POST   | /tables           | Create a table (generates QR code)   | Admin         |
| PUT    | /tables/:id       | Update a table                       | Admin         |
| DELETE | /tables/:id       | Delete a table                       | Admin         |

### Health
| Method | Path         | Description              |
|--------|--------------|--------------------------|
| GET    | /api/health  | Returns `{ ok: true }`   |

---

## 5. How Everything Works Together

### Customer Flow (Ordering)

1. Admin creates a table in the Admin panel → a QR code is generated containing a URL like `https://yourapp.com/menu?tableId=3`
2. Customer scans the QR code with their phone → opens `/menu?tableId=3` in the browser
3. `menu.js` fetches `GET /api/menu/categories` and `GET /api/menu/items` to build the menu
4. Customer adds items to their cart (stored in memory in the page, not the database)
5. Customer taps "Place Order" → `menu.js` sends `POST /api/orders` with the table ID, items, and quantities
6. The backend inserts a row into `orders` and one row per item into `order_items`, then responds with the new order ID
7. The page redirects to `/order?orderId=X` where `order.js` polls `GET /api/orders/:id` every few seconds to show status updates

### Kitchen Flow

1. Kitchen staff open `/kitchen/login` and log in with the kitchen password
2. `kitchen.js` polls `GET /api/orders` every few seconds to fetch all active orders
3. When they mark an order ready, it sends `PUT /api/orders/:id` with `{ status: "ready" }`
4. The customer's order-tracking page picks this up on its next poll and updates the UI

### Admin Flow

1. Admin logs in at `/admin/login`
2. From the admin panel they can:
   - Manage menu categories and items (`/admin/menu`)
   - Upload images for menu items
   - Add/remove tables and print QR codes (`/admin/tables`)
   - View order reports (`/admin/reports`)

### Request Lifecycle

```
Browser (HTML + JS)
    │
    ▼
restaurant/server.js  (port 18641)
    │  Proxies /api/* and /uploads/* requests
    ▼
api-server/src/app.ts  (port 8080)
    │
    ├── Zod validates the request body/params
    ├── JWT middleware checks auth for protected routes
    ├── Drizzle ORM executes a typed SQL query
    └── Returns JSON response
            │
            ▼
        PostgreSQL database
```

### Image Upload Flow

```
Admin selects an image in the form
    │
    ▼
POST /api/menu/upload  (multipart/form-data)
    │
    ▼
Multer saves file to artifacts/api-server/uploads/
    │
    ▼
API returns { url: "/uploads/filename.jpg" }
    │
    ▼
Admin saves the menu item with imageUrl = "/uploads/filename.jpg"
    │
    ▼
Customer page renders:  <img src="/uploads/filename.jpg">
    │
    ▼
restaurant/server.js proxies /uploads/* → api-server
    │
    ▼
Express serves the file from the uploads/ directory
```

---

## 6. Environment Variables

| Variable         | Required | Default                        | Purpose                              |
|------------------|----------|--------------------------------|--------------------------------------|
| DATABASE_URL     | Yes      | —                              | PostgreSQL connection string         |
| PORT             | Yes      | —                              | Port for each server process         |
| JWT_SECRET       | No       | `tableorder-secret-key-2024`   | Signing key for auth tokens          |
| ADMIN_PASSWORD   | No       | `admin1234`                    | Password for the admin user          |
| KITCHEN_PASSWORD | No       | `kitchen1234`                  | Password for the kitchen user        |
| NODE_ENV         | No       | —                              | Set to `production` for prod logging |

---

## 7. Default Login Credentials

| Role    | Username  | Password      |
|---------|-----------|---------------|
| Admin   | admin     | admin1234     |
| Kitchen | kitchen   | kitchen1234   |

> These can be overridden by setting `ADMIN_PASSWORD` and `KITCHEN_PASSWORD` as environment variables.

---

## 8. Running the Project (on Replit)

Everything runs with a single command. Replit manages this automatically via the configured workflow:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev & PORT=18641 pnpm --filter @workspace/restaurant run dev
```

This starts:
- **API server** on port 8080
- **Frontend server** on port 18641 (this is what the browser connects to)

The `dev` command for the API server runs a build first (`esbuild`) then starts the compiled output. There is no hot-reload — changes require a workflow restart.

### Database Schema Sync

If the database schema changes, sync it with:

```bash
pnpm --filter @workspace/db exec drizzle-kit push
```

This reads `lib/db/src/schema/restaurant.ts` and applies any new tables or column changes to the PostgreSQL database safely.

---

## 9. How to Modify the Project

### Add a New Menu Item Field
1. Add the column to `lib/db/src/schema/restaurant.ts`
2. Run `pnpm --filter @workspace/db exec drizzle-kit push` to update the database
3. Update the relevant Zod schema in `lib/api-zod/` if validation is needed
4. Update the API route in `artifacts/api-server/src/routes/menu.ts`
5. Update the frontend JS file (e.g. `admin-menu.js`) to handle the new field

### Add a New API Route
1. Create a new file in `artifacts/api-server/src/routes/`
2. Register it in `artifacts/api-server/src/routes/index.ts`
3. Call the relevant API from the appropriate frontend JS file

### Add a New Frontend Page
1. Create a `.html` file in `artifacts/restaurant/public/`
2. Create a matching `.js` file in `artifacts/restaurant/public/js/`
3. Register the URL path in `artifacts/restaurant/server.js` inside `resolveHtmlFile()`

---

## 10. Key Design Decisions

- **No frontend framework** — The customer-facing UI uses plain Vanilla JS to keep the bundle size minimal and load fast on mobile devices (which is critical for QR-code-based experiences).
- **Polling instead of WebSockets** — Order status updates are fetched by polling every few seconds. This keeps the system simple and reliable without the complexity of maintaining persistent socket connections.
- **JWT in cookies** — Auth tokens are stored in HTTP-only cookies, which are more secure than localStorage.
- **Monorepo with pnpm workspaces** — Shared code (database schema, Zod validators) lives in `lib/` packages and is imported by both the API server and any other app in the workspace.
- **esbuild for bundling** — Compiles the TypeScript API server in under 500ms, making the dev restart cycle fast.
