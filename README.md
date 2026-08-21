# Mini Operations ERP

A production-oriented, full-stack Operations ERP application built with modern Node.js, Express (ES Modules), PostgreSQL with Prisma ORM, and React (Vite & Tailwind CSS).

---

## 📋 Table of Contents
1. [Business Scenario & Flow](#-business-scenario--flow)
2. [Tech Stack](#-tech-stack)
3. [Architecture & Database ER Diagram](#-architecture--database-er-diagram)
4. [Environment Configuration](#-environment-configuration)
5. [Project Setup & Database Migration](#-project-setup--database-migration)
6. [How to Run (Single Command & Modular)](#-how-to-run)
7. [Mandatory Automated Test Suite](#-mandatory-automated-test-suite)
8. [API Documentation (Swagger OpenAPI)](#-api-documentation)
9. [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
10. [Demo Video Walkthrough Guide (5–7 Mins)](#-demo-video-walkthrough-guide)
11. [Live Verification Readiness](#-live-verification-readiness)

---

## 🔄 Business Scenario & Flow

The system coordinates operations across distributed warehouse facilities covering the complete lifecycle:

$$\text{Inventory} \longrightarrow \text{Work Order} \longrightarrow \text{Stock Check} \longrightarrow \text{Internal Transfer / Shortage} \longrightarrow \text{Customer Reservation}$$

1. **Inventory**: Track stock across warehouses and batches with formula:
   $$\text{Available Quantity} = \text{Physical Quantity} - \text{Reserved Quantity}$$
2. **Work Order**: Production orders scheduled by Admin at target warehouse locations.
3. **Stock Check**: Automatic shortage detection:
   $$\text{Shortage} = \max(0, \text{Required Quantity} - \text{Available Stock at Location})$$
4. **Internal Transfer**: Inter-warehouse stock replenishment. Source decreases on dispatch; destination increases **only** on receipt.
5. **Customer Reservation**: Sales order booking with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) inside ACID transactions to strictly prevent overselling.

---

## 🚀 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3.4 | Responsive, minimal enterprise UI with custom SVG visual indicators |
| **Backend API** | Node.js (v20+), Express.js (ES Modules) | RESTful API architecture with Zod request validation and error middleware |
| **Database & ORM**| PostgreSQL, Prisma ORM 5.22 | Relational schema with composite indexes, foreign keys, and atomic transactions |
| **Security** | JWT, bcryptjs, RBAC Middleware | Stateless authentication and role-based route/API protection |
| **Testing** | Jest, Supertest | Full automated test suite covering all 5 business integrity guards |
| **API Docs** | Swagger UI, OpenAPI 3.0 | Interactive API documentation hosted at `/api/docs` |

---

## 🗄️ Architecture & Database ER Diagram

```mermaid
erDiagram
    LOCATION ||--o{ USER : "assigned to"
    LOCATION ||--o{ INVENTORY : "stores"
    LOCATION ||--o{ WORK_ORDER : "executes"
    LOCATION ||--o{ CUSTOMER_ORDER : "fulfills"
    LOCATION ||--o{ INTERNAL_TRANSFER : "dispatches (source)"
    LOCATION ||--o{ INTERNAL_TRANSFER : "receives (dest)"
    
    ITEM ||--o{ INVENTORY : "tracked in"
    ITEM ||--o{ WORK_ORDER : "produced/used in"
    ITEM ||--o{ CUSTOMER_ORDER : "ordered"
    ITEM ||--o{ INTERNAL_TRANSFER : "transferred"
    
    USER ||--o{ WORK_ORDER : "assigned to"

    USER {
        string id PK
        string name
        string email UK
        string password
        enum role "ADMIN | OPERATIONS_USER | SALES_USER"
        string locationId FK
    }

    LOCATION {
        string id PK
        string name
        string code UK
        string address
    }

    ITEM {
        string id PK
        string name
        string sku UK
        string category
        string unit
    }

    INVENTORY {
        string id PK
        string itemId FK
        string locationId FK
        string batch
        int physicalQty
        int reservedQty
        int version
    }

    WORK_ORDER {
        string id PK
        string orderNumber UK
        string locationId FK
        string itemId FK
        int requiredQty
        string assignedUserId FK
        enum status "ASSIGNED | IN_PROGRESS | COMPLETED"
    }

    INTERNAL_TRANSFER {
        string id PK
        string transferNumber UK
        string sourceLocationId FK
        string destLocationId FK
        string itemId FK
        int quantity
        enum status "REQUESTED | DISPATCHED | RECEIVED"
    }

    CUSTOMER_ORDER {
        string id PK
        string orderNumber UK
        string customerName
        string locationId FK
        string itemId FK
        int quantity
        enum status "CONFIRMED | CANCELLED"
    }
```

---

## ⚙️ Environment Configuration

Create a `.env` file in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/mini_erp?schema=public"
JWT_SECRET="mini_erp_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
```

---

## 🛠️ Project Setup & Database Migration

### 1. Install All Dependencies (Root Workspace)
```bash
npm install
```

### 2. Generate Prisma Client & Push Database Schema
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Seed Demo Initial Data
```bash
npm run seed
```

**Pre-seeded Demo Accounts:**
| Role | Email | Password | Allowed Screens |
|---|---|---|---|
| **Admin** | `admin@erp.com` | `Password@123` | Inventory, Work Orders, Transfers, Customer Orders |
| **Operations User** | `ops@erp.com` | `Password@123` | Inventory, Work Orders, Transfers |
| **Sales User** | `sales@erp.com` | `Password@123` | Inventory, Customer Orders |

---

## 🏃 How to Run

### Start Both Frontend & Backend (Recommended):
From the root directory:
```bash
npm run dev
```
- **Frontend Application:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:5000/api`
- **Interactive Swagger Docs:** `http://localhost:5000/api/docs`

---

## 🧪 Mandatory Automated Test Suite

Run the full automated test suite to verify business rules:

```bash
npm test
```

### Tests Covered:
- **Test 1:** Cannot reserve more than available inventory.
- **Test 2:** Cannot transfer more than available inventory.
- **Test 3:** Destination stock increases **only** after transfer receipt (remains unchanged in transit).
- **Test 4:** Same transfer cannot be received twice (duplicate receipt prevention).
- **Test 5:** Unauthorized user cannot perform restricted operation (403 Forbidden RBAC guard).

---

## 📖 API Documentation

Interactive Swagger OpenAPI 3.0 documentation is available when the backend server is running:
- **URL:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- Includes authentication endpoints, inventory summary, stock inwarding, work orders, inter-warehouse transfers, and customer order reservations.

---

## 🔒 Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | Admin | Operations User | Sales User |
| :--- | :---: | :---: | :---: |
| `GET /api/inventory` (View Stock) | ✅ | ✅ | ✅ |
| `POST /api/inventory/add` (Inward Stock) | ✅ | ✅ | ❌ |
| `POST /api/work-orders` (Create Work Order) | ✅ | ❌ | ❌ |
| `PATCH /api/work-orders/:id/status` | ✅ | ✅ | ❌ |
| `POST /api/transfers` (Request Transfer) | ✅ | ✅ | ❌ |
| `POST /api/transfers/:id/dispatch` | ✅ | ✅ | ❌ |
| `POST /api/transfers/:id/receive` | ✅ | ✅ | ❌ |
| `POST /api/customer-orders` (Create Order & Reserve) | ✅ | ❌ | ✅ |

---

## 🎥 Demo Video Walkthrough Guide (5–7 Mins)

When recording your submission demo video, follow this exact chronological sequence:

1. **Login (`0:00 - 1:00`)**:
   - Log in as `Admin` (`admin@erp.com`). Highlight the clean unblurred dashboard.
2. **Inventory Overview (`1:00 - 2:00`)**:
   - Inspect stock at `Warehouse North` (100 KG) and `Warehouse South` (20 KG).
   - Inward or adjust stock in a batch.
3. **Work Order & Shortage Check (`2:00 - 3:15`)**:
   - Create a Work Order at `Warehouse South` for `40 KG`.
   - Show the **automatic Shortage alert** ($40 - 20 = 20\text{ KG}$).
4. **Internal Stock Transfer (`3:15 - 4:45`)**:
   - Click `Transfer Material →` to request 20 KG from `Warehouse North` to `Warehouse South`.
   - Dispatch transfer $\rightarrow$ show North stock reduces to 80 KG while South is still 20 KG.
   - Receive transfer $\rightarrow$ show South stock increases to 40 KG.
   - Return to Work Order $\rightarrow$ shortage is cleared (**Stock Sufficient**), mark status `Completed`.
5. **Customer Sales Reservation (`4:45 - 6:00`)**:
   - Log in as `Sales User` (`sales@erp.com`). Notice the sidebar automatically adjusts to show only Inventory & Customer Orders.
   - Place a customer order for 30 KG. Show `Reserved = 30`, `Available = 10`.
   - Attempt to place another order for 20 KG $\rightarrow$ show error: *"Cannot reserve more than available inventory"*.

---

## 🛡️ Live Verification Readiness

The codebase is structured to easily support live evaluation modifications:
- **Add Damaged Quantity**: Extend `Inventory` model with `damagedQty Int @default(0)` and update formula to $\text{Available} = \text{Physical} - \text{Reserved} - \text{Damaged}$.
- **Partial Transfer Receipts**: Extend `InternalTransfer` with `receivedQuantity Int` and update receipt transaction.
- **Cancel Customer Order**: Atomic order cancellation is already implemented in `customerOrderService.cancelCustomerOrder(id)`.
- **Location Restriction**: Scope Prisma queries using `where: { locationId: req.user.locationId }`.
