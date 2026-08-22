# Mini Operations ERP

A production-oriented, full-stack Operations ERP application built with Node.js, Express (ES Modules), PostgreSQL with Prisma ORM, and React (Vite & Tailwind CSS).

---

## 🌐 Live Production Deployment Links

| Service | Host Provider | Production URL |
| :--- | :--- | :--- |
| **Frontend Live Web App** | **Vercel** | [https://mini-erp-three-gray.vercel.app](https://mini-erp-three-gray.vercel.app) |
| **Backend Swagger API Docs** | **Render** | [https://mini-erp-backend-oazh.onrender.com/api/docs/](https://mini-erp-backend-oazh.onrender.com/api/docs/) |
| **Backend REST API Base** | **Render** | [https://mini-erp-backend-oazh.onrender.com/api](https://mini-erp-backend-oazh.onrender.com/api) |
| **Database Engine** | **Supabase** | Managed PostgreSQL (Live Cloud Instance) |

---

## Table of Contents
1. [Live Production Deployment Links](#-live-production-deployment-links)
2. [Tech Stack](#tech-stack)
3. [Project Setup](#project-setup)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [How to Run](#how-to-run)
7. [How to Test](#how-to-test)
8. [Business Scenario & Workflow](#business-scenario--workflow)
9. [Database ER Diagram & Architecture](#database-er-diagram--architecture)
10. [Role-Based Access Control (RBAC) Matrix](#role-based-access-control-rbac-matrix)
11. [API Documentation (Swagger OpenAPI)](#api-documentation)
12. [Demo Video Walkthrough Guide](#demo-video-walkthrough-guide)

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS 3.4 | Responsive, minimal enterprise UI with custom SVG visual indicators |
| **Backend API** | Node.js (v20+), Express.js (ES Modules) | RESTful API architecture with Zod request validation and error middleware |
| **Database & ORM**| PostgreSQL, Prisma ORM 5.22 | Relational schema with composite indexes, foreign keys, and atomic transactions |
| **Security** | JWT, bcryptjs, RBAC Middleware | Stateless authentication and role-based route/API protection |
| **Testing** | Jest, Supertest | Full automated test suite covering all mandatory business integrity guards |
| **API Docs** | Swagger UI, OpenAPI 3.0 | Interactive API documentation hosted live at `/api/docs` |

---

## Project Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher instance running locally or hosted on Supabase
- **npm**: v9.0 or higher

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/prakhar-bip/Mini-ERP.git
cd Mini-ERP

# 2. Install workspace dependencies
npm install
```

---

## Database Setup

### 1. Database Configuration
Ensure your PostgreSQL instance is running and set your connection URL in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres.pifvfgmvwlesxxfeexat:Prakhar%40123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

### 2. Run Database Migrations & Generate Prisma Client
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Seed Initial Demo Data
```bash
npm run seed
```

**Pre-seeded Demo Accounts:**
| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Admin** | `admin@erp.com` | `Password@123` | Full Access (Inventory, Work Orders, Transfers, Customer Orders, Employees) |
| **Operations User** | `ops@erp.com` | `Password@123` | Inventory, Work Orders, Transfers |
| **Sales User** | `sales@erp.com` | `Password@123` | Inventory, Customer Orders |

---

## Environment Variables

Create a `.env` file inside the `backend/` directory (`backend/.env`):

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.pifvfgmvwlesxxfeexat:Prakhar%40123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="mini_erp_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
```

---

## How to Run

### Start Both Frontend & Backend (Recommended):
Run the single root command to start both servers concurrently:
```bash
npm run dev
```

- **Frontend App (Local):** [http://localhost:5173](http://localhost:5173)
- **Frontend App (Production Live):** [https://mini-erp-three-gray.vercel.app](https://mini-erp-three-gray.vercel.app)
- **Backend REST API (Local):** [http://localhost:5000/api](http://localhost:5000/api)
- **Backend REST API (Production Live):** [https://mini-erp-backend-oazh.onrender.com/api](https://mini-erp-backend-oazh.onrender.com/api)
- **Interactive Swagger Docs (Production Live):** [https://mini-erp-backend-oazh.onrender.com/api/docs/](https://mini-erp-backend-oazh.onrender.com/api/docs/)

---

## How to Test

Execute the mandatory automated Jest test suite to verify business rules:

```bash
npm test
```

### Mandatory Business Integrity Tests Covered:
- **Test 1:** Cannot reserve more than available inventory (Stock reservation limit guard).
- **Test 2:** Cannot transfer more than available inventory (Stock transfer limit guard).
- **Test 3:** Destination stock increases **only** after transfer receipt (remains unchanged in transit).
- **Test 4:** Same transfer cannot be received twice (duplicate receipt prevention).
- **Test 5:** Unauthorized user cannot perform restricted operation (403 Forbidden RBAC guard).

---

## Business Scenario & Workflow

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

## Database ER Diagram & Architecture

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

## Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | Admin | Operations User | Sales User |
| :--- | :---: | :---: | :---: |
| `GET /api/inventory` (View Stock) | Yes | Yes | Yes |
| `POST /api/inventory/add` (Inward Stock) | Yes | Yes | No |
| `POST /api/work-orders` (Create Work Order) | Yes | No | No |
| `PATCH /api/work-orders/:id/status` | Yes | Yes | No |
| `POST /api/transfers` (Request Transfer) | Yes | Yes | No |
| `POST /api/transfers/:id/dispatch` | Yes | Yes | No |
| `POST /api/transfers/:id/receive` | Yes | Yes | No |
| `POST /api/customer-orders` (Create Order & Reserve) | Yes | No | Yes |
| `POST /api/master/users` (Add Employee Account) | Yes | No | No |

---

## API Documentation

Interactive Swagger OpenAPI 3.0 documentation is available at:
- **Live Production URL:** [https://mini-erp-backend-oazh.onrender.com/api/docs/](https://mini-erp-backend-oazh.onrender.com/api/docs/)
- **Local Server URL:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **OpenAPI Specification File:** [`backend/src/docs/swagger.json`](./backend/src/docs/swagger.json)
- **Postman Collection File:** [`docs/postman_collection.json`](./docs/postman_collection.json)
