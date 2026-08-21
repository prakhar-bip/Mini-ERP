# Mini Operations ERP

A production-oriented full-stack Operations ERP application built with modern JavaScript (ES Modules), Node.js, Express, PostgreSQL, Prisma ORM, and React (Vite & Tailwind CSS).

---

## 🚀 Tech Stack

- **Backend:** Node.js (v20+), Express.js (ES Modules), Prisma ORM
- **Database:** PostgreSQL (with ACID transactions & row-level locking)
- **Authentication:** JSON Web Tokens (JWT) + bcrypt password hashing
- **Authorization:** Role-Based Access Control (Admin, Operations User, Sales User)
- **Frontend:** React 18 (JSX), Vite, Tailwind CSS, Lucide Icons, Axios
- **Documentation:** OpenAPI / Swagger & Mermaid ER Diagrams

---

## 🗄️ Database Architecture & ER Diagram

Detailed database documentation and visual Entity-Relationship diagrams are available in [`docs/database-schema.md`](./docs/database-schema.md).

### Core Entities:
- **`users`**: Role-based system accounts (`ADMIN`, `OPERATIONS_USER`, `SALES_USER`).
- **`locations`**: Physical warehouses / branches.
- **`items`**: Catalog of raw materials and finished products.
- **`inventories`**: Stock buckets with compound unique key `(item_id, location_id, batch)` and formula:
  $$\text{Available} = \text{Physical} - \text{Reserved}$$
- **`work_orders`**: Manufacturing/Assembly orders with automated shortage calculations.
- **`internal_transfers`**: Multi-state stock transfer pipeline (`REQUESTED` $\rightarrow$ `DISPATCHED` $\rightarrow$ `RECEIVED`).
- **`customer_orders`**: Sales orders with concurrency-safe stock reservation locks.

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp?schema=public"
JWT_SECRET="mini_erp_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
```

---

## 🛠️ Project Setup & Installation

### 1. Install Dependencies
```bash
# Install all root, backend, and frontend dependencies
npm install
```

### 2. Database Migration & Schema Push
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Seed Initial Demo Data
```bash
# Seeds demo warehouses, items, role-based users, and inventory
cd backend
npm run seed
```

**Pre-seeded Demo Accounts:**
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@erp.com` | `Password@123` |
| **Operations** | `ops@erp.com` | `Password@123` |
| **Sales** | `sales@erp.com` | `Password@123` |

---

## 🏃 Running the Application

### Start Backend API:
```bash
npm run dev:backend
# API starts at http://localhost:5000
```

### Start Frontend Client:
```bash
npm run dev:frontend
# App opens at http://localhost:5173
```

---

## 🧪 Running Automated Tests

```bash
cd backend
npm test
```
