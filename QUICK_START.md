# 🚀 Inventory Tracker - Quick Start Guide

## ✅ Servers Running

**Backend API:** http://localhost:3000  
**Frontend UI:** http://localhost:5173

Both servers are now running and ready for inspection!

---

## 🌐 Access the Application

### Frontend (Vue.js UI)
Open your browser and navigate to:
```
http://localhost:5173
```

You'll see the **Login Page**:
- Username: `admin`
- Password: `admin123`

After login, you'll have access to:
- **Dashboard** - Real-time inventory value and product list
- **Suppliers** - (Placeholder - not yet built)
- **Products** - (Placeholder - not yet built)
- **Purchases** - (Placeholder - not yet built)
- **Inventory** - (Placeholder - not yet built)
- **Year-End Count** - (Placeholder - not yet built)
- **Reports** - (Placeholder - not yet built)

---

## 🔧 Backend API Endpoints

### Test with curl:

#### 1. Login (Get JWT Token)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response:
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

#### 2. Get Inventory Value (requires token)
```bash
# First, get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Then use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/inventory/value
```

#### 3. Get All Suppliers
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/suppliers
```

#### 4. Get All Products
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/products
```

#### 5. Get FIFO Lots for Product ID 1 (Bolt 10mm)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/inventory/lots/1
```

---

## 📊 Test Data Available

### Users
- **admin** / admin123

### Suppliers
1. Acme Corp
2. Widget Warehouse

### Products
1. Bolt 10mm (Acme Corp)
2. Widget Standard (Widget Warehouse)
3. Gasket Ring A (Acme Corp)

### Purchase Lots (Multi-Year FIFO Data)

**2022:**
- Bolt 10mm: 500 units @ $1.00/unit, remaining: 120
- Widget Standard: 200 units @ $5.00/unit, remaining: 10

**2023:**
- Bolt 10mm: 300 units @ $1.25/unit, remaining: 85
- Widget Standard: 150 units @ $5.50/unit, remaining: 10
- Gasket Ring A: 1000 units @ $0.75/unit, remaining: 450

**2024:**
- Bolt 10mm: 400 units @ $1.50/unit, remaining: 400
- Gasket Ring A: 800 units @ $0.80/unit, remaining: 800

---

## 🧪 Test Year-End Count Workflow

### Step 1: Initiate Year-End Count for 2024
```bash
curl -X POST http://localhost:3000/api/year-end-count \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}'
```

### Step 2: Get Count Sheet (ID will be 1)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/year-end-count/1/sheet
```

### Step 3: Update Count Item (Product ID 1, counted 500)
```bash
curl -X PUT http://localhost:3000/api/year-end-count/1/items/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"countedQuantity": 500}'
```

### Step 4: Export Count Sheet to CSV
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/year-end-count/1/export-csv \
  --output count-sheet.csv
```

### Step 5: Export Count Sheet to PDF
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/year-end-count/1/export-pdf \
  --output count-sheet.pdf
```

### Step 6: Preview Report
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/year-end-count/1/report
```

---

## 📁 Project Structure

```
inventory-tracker/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (FIFO here!)
│   │   ├── middleware/      # Auth, error handling
│   │   ├── utils/           # Prisma, config
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/
│   │   └── seed.ts          # Test data
│   └── data/
│       └── inventory.db     # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── views/           # Page components
│   │   ├── stores/          # Pinia state management
│   │   ├── services/        # API client
│   │   ├── router/          # Vue Router
│   │   └── main.ts
│   └── package.json
│
├── openspec/                # Design specs & proposals
└── README.md
```

---

## 🎯 What's Implemented

### ✅ Backend (80% Complete)
- [x] Authentication (JWT + bcrypt)
- [x] Suppliers CRUD API
- [x] Products CRUD API
- [x] Purchases CRUD API (with year locking)
- [x] **FIFO Inventory Valuation** (CRITICAL - all queries use ORDER BY purchaseDate ASC)
- [x] **Year-End Count Process**
  - [x] Initiate count
  - [x] Count sheet generation (alphabetical)
  - [x] Real-time variance calculation
  - [x] CSV/PDF export
  - [x] CSV import with validation
  - [x] FIFO lot updates on confirmation
  - [x] Year locking
- [ ] Reporting API (pending)
- [ ] Database backup to GCS (pending)

### ✅ Frontend (15% Complete)
- [x] Vue 3 + TypeScript + Vite setup
- [x] Vue Router with auth guards
- [x] Pinia state management
- [x] Axios API client
- [x] PrimeVue UI framework
- [x] Login page
- [x] Dashboard (shows FIFO inventory values)
- [ ] Suppliers CRUD UI (pending)
- [ ] Products CRUD UI (pending)
- [ ] Purchases CRUD UI (pending)
- [ ] Year-End Count UI (pending)
- [ ] Reports UI (pending)

---

## 🔍 Key Features to Inspect

### 1. **FIFO Ordering** (Most Critical)
All inventory queries enforce `ORDER BY purchaseDate ASC`:

File: `backend/src/services/inventoryService.ts`
- `getLotsByFIFOOrder()` - line 13
- `getCurrentInventoryQuantity()` - line 30
- `getCurrentInventoryValue()` - line 49
- `consumeInventoryFIFO()` - line 141

### 2. **Year Locking**
Prevents edits to confirmed years:

File: `backend/src/services/purchaseService.ts`
- Check before create: line 64-68
- Check before update: line 122-126
- Check before delete: line 184-188

### 3. **Year-End Count Sheet**
Alphabetically sorted for easy counting:

File: `backend/src/services/yearEndCountService.ts`
- `getCountSheet()` - line 54 (sorts by product name)

### 4. **Real-time Variance Calculation**
Auto-calculates as user enters counts:

File: `backend/src/services/yearEndCountService.ts`
- `updateCountItem()` - line 89 (calculates variance and FIFO value)

### 5. **Dashboard with Live Data**
Frontend shows FIFO-calculated values:

File: `frontend/src/views/DashboardView.vue`
- Fetches from `/api/inventory/value`
- Displays total value and per-product breakdown

---

## 🐛 Check Server Logs

If something isn't working:

```bash
# Backend logs
cat backend.log

# Frontend logs
cat frontend.log
```

---

## 🛑 Stop Servers

When done inspecting:

```bash
pkill -f "ts-node backend/src/server.ts"
pkill -f "vite"
```

---

## 📝 Next Steps

After inspecting, you can request:
1. Complete Year-End Count UI (most important)
2. Build all CRUD UIs (Suppliers, Products, Purchases)
3. Add Reporting features
4. Implement GCS backup
5. Write tests

---

**Enjoy exploring the application!** 🎉
