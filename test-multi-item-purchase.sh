#!/bin/bash
# Test script for multi-item purchase feature
# This script tests the batch purchase API endpoint

set -e

API_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Testing Multi-Item Purchase Feature ===${NC}\n"

# Step 1: Get suppliers
echo "1. Fetching suppliers..."
SUPPLIERS=$(curl -s "$API_URL/suppliers")
SUPPLIER_ID=$(echo "$SUPPLIERS" | jq -r '.[0].id // empty')

if [ -z "$SUPPLIER_ID" ]; then
    echo -e "${RED}❌ No suppliers found. Please create a supplier first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Found supplier ID: $SUPPLIER_ID${NC}\n"

# Step 2: Get products from this supplier
echo "2. Fetching products from supplier $SUPPLIER_ID..."
PRODUCTS=$(curl -s "$API_URL/products?supplierId=$SUPPLIER_ID")
PRODUCT_COUNT=$(echo "$PRODUCTS" | jq 'length')

if [ "$PRODUCT_COUNT" -lt 3 ]; then
    echo -e "${RED}❌ Need at least 3 products from same supplier. Found: $PRODUCT_COUNT${NC}"
    exit 1
fi

PRODUCT1=$(echo "$PRODUCTS" | jq -r '.[0].id')
PRODUCT2=$(echo "$PRODUCTS" | jq -r '.[1].id')
PRODUCT3=$(echo "$PRODUCTS" | jq -r '.[2].id')

echo -e "${GREEN}✓ Found products: $PRODUCT1, $PRODUCT2, $PRODUCT3${NC}\n"

# Step 3: Create batch purchase
echo "3. Creating batch purchase..."
BATCH_PAYLOAD=$(cat <<EOF
{
  "supplierId": $SUPPLIER_ID,
  "purchaseDate": "$(date +%Y-%m-%d)",
  "verificationNumber": "TEST-$(date +%s)",
  "shippingCost": 10,
  "items": [
    {
      "productId": $PRODUCT1,
      "quantity": 1,
      "unitCost": 5.00
    },
    {
      "productId": $PRODUCT2,
      "quantity": 1,
      "unitCost": 5.00
    },
    {
      "productId": $PRODUCT3,
      "quantity": 1,
      "unitCost": 10.00
    }
  ]
}
EOF
)

RESPONSE=$(curl -s -X POST "$API_URL/purchases/batch" \
  -H "Content-Type: application/json" \
  -d "$BATCH_PAYLOAD")

# Check for errors
ERROR=$(echo "$RESPONSE" | jq -r '.error // empty')
if [ -n "$ERROR" ]; then
    echo -e "${RED}❌ Error creating batch: $ERROR${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

BATCH_ID=$(echo "$RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Created batch ID: $BATCH_ID${NC}\n"

# Step 4: Verify shipping allocation
echo "4. Verifying shipping allocation..."
echo "$RESPONSE" | jq -r '.lots[] | "Product \(.productId): quantity=\(.quantity), unitCost=\(.unitCost), allocatedShipping=\(.allocatedShipping)"'

# Expected: $5 + ($5/20)*$10 = $7.50, $5 + ($5/20)*$10 = $7.50, $10 + ($10/20)*$10 = $15.00
LOT1_COST=$(echo "$RESPONSE" | jq -r '.lots[0].unitCost')
LOT2_COST=$(echo "$RESPONSE" | jq -r '.lots[1].unitCost')
LOT3_COST=$(echo "$RESPONSE" | jq -r '.lots[2].unitCost')

if [ "$LOT1_COST" = "7.5" ] && [ "$LOT2_COST" = "7.5" ] && [ "$LOT3_COST" = "15" ]; then
    echo -e "${GREEN}✓ Shipping allocation correct!${NC}"
    echo "  Item 1: \$5.00 + \$2.50 shipping = \$7.50 ✓"
    echo "  Item 2: \$5.00 + \$2.50 shipping = \$7.50 ✓"
    echo "  Item 3: \$10.00 + \$5.00 shipping = \$15.00 ✓"
else
    echo -e "${RED}❌ Shipping allocation incorrect!${NC}"
    echo "  Expected: 7.5, 7.5, 15"
    echo "  Got: $LOT1_COST, $LOT2_COST, $LOT3_COST"
    exit 1
fi
echo ""

# Step 5: Retrieve batch by ID
echo "5. Retrieving batch by ID..."
BATCH_DETAIL=$(curl -s "$API_URL/purchases/batch/$BATCH_ID")
BATCH_LOT_COUNT=$(echo "$BATCH_DETAIL" | jq '.lots | length')

if [ "$BATCH_LOT_COUNT" = "3" ]; then
    echo -e "${GREEN}✓ Retrieved batch with $BATCH_LOT_COUNT lots${NC}\n"
else
    echo -e "${RED}❌ Expected 3 lots, got $BATCH_LOT_COUNT${NC}"
    exit 1
fi

# Step 6: Filter purchases by batchId
echo "6. Testing filter by batchId..."
FILTERED=$(curl -s "$API_URL/purchases?batchId=$BATCH_ID")
FILTERED_COUNT=$(echo "$FILTERED" | jq 'length')

if [ "$FILTERED_COUNT" = "3" ]; then
    echo -e "${GREEN}✓ Filter returned $FILTERED_COUNT lots${NC}\n"
else
    echo -e "${RED}❌ Expected 3 lots, got $FILTERED_COUNT${NC}"
    exit 1
fi

# Success summary
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Summary:"
echo "  - Created batch ID: $BATCH_ID"
echo "  - 3 lots created with correct shipping allocation"
echo "  - Batch retrieval works"
echo "  - Batch filtering works"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Navigate to Purchases view"
echo "  3. Click 'Add Multi-Item Purchase' button"
echo "  4. Look for batch #$BATCH_ID in the table with a clickable badge"
echo "  5. Click the badge to filter and see all 3 items"
