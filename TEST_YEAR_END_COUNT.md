# Year-End Count Workflow - Test Script

## Prerequisites
Server running on http://localhost:3000

## Step 1: Login and Get Token
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"
```

## Step 2: Check Current Inventory
```bash
# Get total inventory value before count
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/inventory/value | jq '.'
```

## Step 3: Initiate Year-End Count for 2024
```bash
curl -s -X POST http://localhost:3000/api/year-end-count \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}' | jq '.'
```

## Step 4: Get Count Sheet
```bash
# Replace COUNT_ID with ID from step 3
COUNT_ID=1

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/year-end-count/${COUNT_ID}/sheet" | jq '.'
```

## Step 5: Export Count Sheet to CSV (for offline counting)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/year-end-count/${COUNT_ID}/export-csv" \
  --output count-sheet-2024.csv

echo "CSV exported to count-sheet-2024.csv"
cat count-sheet-2024.csv
```

## Step 6: Export Count Sheet to PDF (for printing)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/year-end-count/${COUNT_ID}/export-pdf" \
  --output count-sheet-2024.pdf

echo "PDF exported to count-sheet-2024.pdf"
```

## Step 7: Enter Count Data (simulating physical count)
```bash
# Bolt 10mm (product ID 1) - counted 500 units
curl -s -X PUT "http://localhost:3000/api/year-end-count/${COUNT_ID}/items/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"countedQuantity": 500}' | jq '.'

# Gasket Ring A (product ID 3) - counted 1200 units  
curl -s -X PUT "http://localhost:3000/api/year-end-count/${COUNT_ID}/items/3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"countedQuantity": 1200}' | jq '.'
```

## Step 8: Check Variances
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/year-end-count/${COUNT_ID}/variances" | jq '.'
```

## Step 9: Generate Year-End Report (preview before confirming)
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/year-end-count/${COUNT_ID}/report" | jq '.'
```

## Step 10: Confirm Year-End Count (CRITICAL - locks year and updates FIFO lots)
```bash
# This will:
# 1. Update all lot remainingQuantity values using FIFO
# 2. Lock year 2024 to prevent further edits
# 3. Mark count as confirmed

curl -s -X POST "http://localhost:3000/api/year-end-count/${COUNT_ID}/confirm" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Step 11: Verify Year is Locked
```bash
# Try to create a purchase for 2024 - should fail
curl -s -X POST http://localhost:3000/api/purchases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "supplierId": 1,
    "purchaseDate": "2024-12-01",
    "quantity": 100,
    "unitCost": 2.00
  }' | jq '.'

# Should return error: "Cannot create purchase for locked year 2024"
```

## Step 12: View Final Inventory After Count
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/inventory/value | jq '.'
```

## FIFO Verification

### Expected Behavior:
If Bolt 10mm counted quantity = 500:
- Before count: 
  - 2022 lot: 120 remaining @ $1.00
  - 2023 lot: 85 remaining @ $1.25
  - 2024 lot: 400 remaining @ $1.50
  - Total: 605 units

- After count (500 units):
  - FIFO consumption keeps oldest lots first:
  - 2022 lot: 120 remaining @ $1.00 (kept)
  - 2023 lot: 85 remaining @ $1.25 (kept)
  - 2024 lot: 295 remaining @ $1.50 (105 consumed from this lot)
  - Total: 500 units
  - Value: (120 × $1.00) + (85 × $1.25) + (295 × $1.50) = $664.25

### Verify FIFO lots:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/inventory/lots/1" | jq '.'
```

## CSV Import Test (Alternative to Manual Entry)

### Step 1: Create CSV with counts
```bash
cat > import-counts.csv << 'EOF'
Product Name,Actual Count
Bolt 10mm,500
Gasket Ring A,1200
EOF
```

### Step 2: Import CSV
```bash
curl -X POST "http://localhost:3000/api/year-end-count/${COUNT_ID}/import-csv" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@import-counts.csv" | jq '.'
```

## Complete Year-End Count Workflow Summary

1. ✅ Initiate count for year
2. ✅ Generate alphabetically sorted count sheet
3. ✅ Export to CSV/PDF for offline counting
4. ✅ Enter counted quantities (manual or CSV import)
5. ✅ Real-time variance calculation
6. ✅ Preview report with FIFO values
7. ✅ Confirm count
8. ✅ FIFO lot quantities updated (oldest first)
9. ✅ Year locked to prevent edits
10. ✅ Backup created (Task 10)
