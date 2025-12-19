<template>
  <div class="inventory-view">
    <div class="header">
      <h1>Inventory Management</h1>
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        @click="refreshInventory"
        :loading="loading"
      />
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <Card>
        <template #content>
          <div class="summary-card">
            <div class="summary-icon" style="background: var(--blue-100)">
              <i class="pi pi-box" style="color: var(--blue-600)"></i>
            </div>
            <div class="summary-details">
              <div class="summary-label">Total Products</div>
              <div class="summary-value">{{ filteredInventoryItems.length }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="summary-card">
            <div class="summary-icon" style="background: var(--green-100)">
              <i class="pi pi-database" style="color: var(--green-600)"></i>
            </div>
            <div class="summary-details">
              <div class="summary-label">Total Inventory Value</div>
              <div class="summary-value">${{ totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="summary-card">
            <div class="summary-icon" style="background: var(--orange-100)">
              <i class="pi pi-chart-bar" style="color: var(--orange-600)"></i>
            </div>
            <div class="summary-details">
              <div class="summary-label">Total Units</div>
              <div class="summary-value">{{ totalUnits.toLocaleString() }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Inventory Table -->
    <Card>
      <template #content>
        <DataTable
          :value="filteredInventoryItems"
          :loading="loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <template #header>
            <div class="table-header">
              <div class="filters">
                <IconField iconPosition="left">
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="searchQuery"
                    placeholder="Search inventory..."
                  />
                </IconField>
                <div class="checkbox-wrapper">
                  <Checkbox
                    v-model="showZeroQuantity"
                    inputId="showZero"
                    :binary="true"
                  />
                  <label for="showZero" class="checkbox-label">Show items with zero quantity</label>
                </div>
              </div>
            </div>
          </template>

          <Column field="productName" header="Product" sortable />

          <Column field="supplierName" header="Primary Supplier" sortable>
            <template #body="{ data }">
              <Tag :value="data.supplierName" severity="info" />
            </template>
          </Column>

          <Column field="totalQuantity" header="Total Quantity" sortable style="width: 180px">
            <template #body="{ data }">
              <Tag
                :value="`${data.totalQuantity.toLocaleString()} ${data.productUnit}`"
                :severity="data.totalQuantity > 0 ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column field="averageUnitCost" header="Avg Unit Cost" sortable style="width: 150px">
            <template #body="{ data }">
              ${{ data.averageUnitCost.toFixed(2) }}
            </template>
          </Column>

          <Column field="totalValue" header="Total Value" sortable style="width: 150px">
            <template #body="{ data }">
              <strong>${{ data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</strong>
            </template>
          </Column>

          <Column field="lotCount" header="# Lots" sortable style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data.lotCount" severity="secondary" />
            </template>
          </Column>

          <Column header="Actions" style="width: 100px">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                size="small"
                text
                rounded
                @click="viewLots(data)"
                v-tooltip.top="'View FIFO Lots'"
              />
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
              <p>No inventory items found</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- FIFO Lots Dialog -->
    <Dialog
      v-model:visible="lotsDialogVisible"
      :header="`FIFO Purchase Lots - ${selectedProduct?.productName}`"
      modal
      :style="{ width: '90vw', maxWidth: '1000px' }"
    >
      <div v-if="selectedProduct" class="lots-dialog-content">
        <div class="product-summary">
          <div class="summary-item">
            <strong>Supplier:</strong> {{ selectedProduct.supplierName }}
          </div>
          <div class="summary-item">
            <strong>Total Quantity:</strong> {{ selectedProduct.totalQuantity.toLocaleString() }} {{ selectedProduct.productUnit }}
          </div>
          <div class="summary-item">
            <strong>Avg Unit Cost:</strong> ${{ selectedProduct.averageUnitCost.toFixed(2) }}
          </div>
          <div class="summary-item">
            <strong>Total Value:</strong> ${{ selectedProduct.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
          </div>
        </div>

        <h4>Purchase Lots (FIFO Order - Oldest First)</h4>
        <DataTable :value="selectedProduct.lots" size="small" stripedRows>
          <Column field="purchaseDate" header="Purchase Date" sortable>
            <template #body="{ data }">
              {{ formatDate(data.purchaseDate) }}
            </template>
          </Column>

          <Column field="supplier.name" header="Supplier">
            <template #body="{ data }">
              {{ data.supplier?.name || 'Unknown' }}
            </template>
          </Column>

          <Column field="quantity" header="Original Qty">
            <template #body="{ data }">
              {{ data.quantity.toLocaleString() }}
            </template>
          </Column>

          <Column field="remainingQuantity" header="Remaining Qty">
            <template #body="{ data }">
              <Tag
                :value="data.remainingQuantity.toLocaleString()"
                :severity="data.remainingQuantity > 0 ? 'success' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="unitCost" header="Unit Cost">
            <template #body="{ data }">
              ${{ data.unitCost.toFixed(2) }}
            </template>
          </Column>

          <Column header="Lot Value">
            <template #body="{ data }">
              <strong>${{ (data.remainingQuantity * data.unitCost).toFixed(2) }}</strong>
            </template>
          </Column>

          <Column field="year" header="Year">
            <template #body="{ data }">
              <Tag :value="data.year" severity="secondary" />
            </template>
          </Column>

          <template #empty>
            <div class="empty-lots">No lots available</div>
          </template>
        </DataTable>
      </div>

      <template #footer>
        <Button label="Close" @click="lotsDialogVisible = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import api from '@/services/api';

import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Checkbox from 'primevue/checkbox';

interface Supplier {
  id: number;
  name: string;
}

interface Lot {
  id: number;
  productId: number;
  supplierId: number;
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  remainingQuantity: number;
  year: number;
  supplier?: Supplier;
}

interface InventoryItem {
  productId: number;
  productName: string;
  productUnit: string;
  supplierName: string;
  totalQuantity: number;
  averageUnitCost: number;
  totalValue: number;
  lotCount: number;
  lots: Lot[];
}

const toast = useToast();

const inventoryItems = ref<InventoryItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showZeroQuantity = ref(false);
const lotsDialogVisible = ref(false);
const selectedProduct = ref<InventoryItem | null>(null);

// Computed: filtered inventory items
const filteredInventoryItems = computed(() => {
  let filtered = inventoryItems.value;
  
  // Filter out zero quantity items by default
  if (!showZeroQuantity.value) {
    filtered = filtered.filter(item => item.totalQuantity > 0);
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item => 
      item.productName.toLowerCase().includes(query) ||
      item.supplierName.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Computed: total inventory value (based on filtered items)
const totalInventoryValue = computed(() => {
  return filteredInventoryItems.value.reduce((sum, item) => sum + item.totalValue, 0);
});

// Computed: total units (based on filtered items)
const totalUnits = computed(() => {
  return filteredInventoryItems.value.reduce((sum, item) => sum + item.totalQuantity, 0);
});

// Fetch inventory with lots
const fetchInventory = async () => {
  loading.value = true;
  try {
    // Fetch all products
    const productsResponse = await api.get('/products');
    const products = productsResponse.data;

    // Fetch inventory data for each product
    const inventoryPromises = products.map(async (product: any) => {
      try {
        // Get FIFO lots for this product
        const lotsResponse = await api.get(`/inventory/lots/${product.id}`);
        const lots: Lot[] = lotsResponse.data;

        // Calculate totals
        const totalQuantity = lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
        const totalValue = lots.reduce((sum, lot) => sum + (lot.remainingQuantity * lot.unitCost), 0);
        const averageUnitCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        return {
          productId: product.id,
          productName: product.name,
          productUnit: product.unit?.name || 'pieces',
          supplierName: product.supplier?.name || 'Unknown',
          totalQuantity,
          averageUnitCost,
          totalValue,
          lotCount: lots.filter(lot => lot.remainingQuantity > 0).length,
          lots: lots.filter(lot => lot.remainingQuantity > 0), // Only show lots with remaining quantity
        };
      } catch (error) {
        console.error(`Failed to fetch lots for product ${product.id}:`, error);
        return {
          productId: product.id,
          productName: product.name,
          productUnit: product.unit?.name || 'pieces',
          supplierName: product.supplier?.name || 'Unknown',
          totalQuantity: 0,
          averageUnitCost: 0,
          totalValue: 0,
          lotCount: 0,
          lots: [],
        };
      }
    });

    inventoryItems.value = await Promise.all(inventoryPromises);

    // Sort by total value descending
    inventoryItems.value.sort((a, b) => b.totalValue - a.totalValue);
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to load inventory',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Refresh inventory
const refreshInventory = () => {
  fetchInventory();
};

// View lots for a product
const viewLots = (item: InventoryItem) => {
  selectedProduct.value = item;
  lotsDialogVisible.value = true;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Load data on mount
onMounted(() => {
  fetchInventory();
});
</script>

<style scoped>
.inventory-view {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.summary-details {
  flex: 1;
}

.summary-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--text-color);
  cursor: pointer;
  user-select: none;
}

.lot-expansion {
  padding: 1.5rem;
  background: var(--surface-50);
}

.lot-expansion h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lot-expansion h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: var(--primary-color);
  border-radius: 2px;
}

.empty-lots {
  text-align: center;
  padding: 1rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.empty-state p {
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.lots-dialog-content {
  padding: 1rem 0;
}

.product-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item strong {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.lots-dialog-content h4 {
  margin: 1.5rem 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}
</style>
