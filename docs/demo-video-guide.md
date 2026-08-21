# 🎬 5-7 Minute Demo Video Script & Evaluation Flow

Use this exact walkthrough script to record your **5–7 minute demo video** for the Mini Operations ERP assignment submission.

---

## ⏱️ Video Timeline & Screen Breakdown

### **[0:00 - 0:45] Intro & Architecture Overview**
* **Say:** "Hi, this is my submission for the Mini Operations ERP technical case study. The system is built with a pure JavaScript stack: Node.js, Express, Prisma ORM, PostgreSQL (hosted on Supabase), and React with Tailwind CSS."
* **Show:** Quick glance at the clean folder structure (`/backend`, `/frontend`, `/docs`) and the live database schema.

---

### **[0:45 - 1:30] Step 1: Login & Role-Based Access Control (RBAC)**
* **Show Screen:** `http://localhost:5173/login`
* **Action:**
  1. Highlight the **1-Click Quick Demo Login** buttons for **Admin**, **Operations Manager**, and **Sales Executive**.
  2. Click **Admin** login $\rightarrow$ Lands on Inventory Dashboard.
  3. Show the Top Header bar with the dynamic Role Switcher (`Admin` $\rightarrow$ `Ops` $\rightarrow$ `Sales`) and `Ctrl+K` global search.
* **Explain:** "Backend authorization is strictly enforced with JWT tokens and route-level RBAC middlewares."

---

### **[1:30 - 2:45] Step 2: Inventory Management & Calculation Formula**
* **Show Screen:** `Inventory` tab (`/inventory`)
* **Explain:** 
  * "Available stock is calculated in real time using the formula: **Available = Physical - Reserved**."
  * Point out the badges: **Physical (Blue)**, **Reserved (Orange)**, **Available (Green)**.
* **Action:**
  1. Fill the **Stock Inwarding** form on the left:
     * Item: `Raw Material Steel Rods`
     * Location: `Warehouse North (WH-01)`
     * Batch: `BATCH-DEMO-01`
     * Quantity: `50`
  2. Click **"Inward Stock Bucket"** $\rightarrow$ Show the table updating instantly with the new batch.

---

### **[2:45 - 4:00] Step 3: Work Order + Automatic Material Shortage Check**
* **Show Screen:** `Work Orders` tab (`/work-orders`)
* **Action:**
  1. Click **"+ Create Work Order"** (as Admin).
  2. Create a work order for `Warehouse South (WH-02)` with `Raw Material Steel Rods` and Quantity `100`.
  3. Submit $\rightarrow$ Point out the **Automated Shortage Badge**:
     * *"Shortage: 80 KG (Available at location: 20 KG)"*
  4. Advance status: Click **"Start"** (`In Progress`) $\rightarrow$ Click **"Complete"** (`Completed`).

---

### **[4:00 - 5:15] Step 4: Internal Stock Transfer (ACID Transaction Pipeline)**
* **Show Screen:** `Transfers` tab (`/transfers`)
* **Explain & Action:**
  1. Click **"+ Request Transfer"**:
     * From: `Warehouse North` $\rightarrow$ To: `Warehouse South`
     * Item: `Raw Material Steel Rods`
     * Quantity: `40`
  2. Show Status: `REQUESTED`.
  3. Click **"Dispatch Stock"**:
     * Status changes to `In-Transit (Dispatched)`.
     * **Point out rule:** Source stock reduced by 40, destination stock is **NOT** increased yet.
  4. Click **"Receive Stock"**:
     * Status changes to `Received`.
     * Destination warehouse stock now increases.
     * Show that the receive button is permanently disabled (Double-receive prevented).

---

### **[5:15 - 6:15] Step 5: Customer Orders & Concurrency-Safe Stock Reservation**
* **Show Screen:** `Customer Orders` tab (`/customer-orders`)
* **Action:**
  1. Switch role to **Sales Executive** using the top header button.
  2. Click **"+ New Customer Order"**:
     * Customer: `Bharat Heavy Electricals`
     * Location: `Warehouse North`
     * Item: `Raw Material Steel Rods`
     * Notice the **Live Available Stock preview**.
     * Enter Quantity `30` $\rightarrow$ Submit.
  3. Show the order created as `Confirmed` and reserved stock updated on the Inventory page.
* **Explain Concurrency Guard:**
  * "Under simultaneous user load, stock reservation is executed inside an ACID transaction with PostgreSQL row-level locks (`SELECT FOR UPDATE`), guaranteeing zero overselling."
  * Show the **"Cancel & Release"** button which releases the reserved stock back to available.

---

### **[6:15 - 7:00] Step 6: Automated Test Suite & Swagger API Docs**
* **Show Terminal:**
  * Run `npm test` $\rightarrow$ Show **all 5 mandatory tests passing (5/5 PASS)** in < 2 seconds.
* **Show Browser:**
  * Open `http://localhost:5000/api/docs` $\rightarrow$ Show interactive Swagger UI.
* **Say:** "Thank you! All requirements, database transactions, concurrency protections, and test cases are verified and complete."
