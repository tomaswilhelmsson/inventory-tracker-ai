<template>
  <div class="inventory-view">
    <div class="header">
      <h1>{{ t('inventory.title') }}</h1>
      <Button
        :label="t('inventory.refresh')"
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
              <div class="summary-label">{{ t('inventory.totalProducts') }}</div>
              <div class="summary-value">{{ n(filteredInventoryItems.length, 'integer') }}</div>
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
              <div class="summary-label">{{ t('inventory.totalInventoryValue') }}</div>
              <div class="summary-value">{{ formatCurrency(totalInventoryValue) }}</div>
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
              <div class="summary-label">{{ t('inventory.totalUnits') }}</div>
              <div class="summary-value">{{ n(totalUnits, 'quantity') }}</div>
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
                    :placeholder="t('inventory.searchInventory')"
                  />
                </IconField>
                <div class="checkbox-wrapper">
                  <Checkbox
                    v-model="showZeroQuantity"
                    inputId="showZero"
                    :binary="true"
                  />
                  <label for="showZero" class="checkbox-label">{{ t('inventory.showZeroQuantity') }}</label>
                </div>
              </div>
            </div>
          </template>

          <Column field="productName" :header="t('inventory.table.product')" sortable>
            <template #body="{ data }">
              <span 
                class="product-name-link"
                @click="openHistoryDialog(data)"
                style="cursor: pointer; color: var(--primary-color); text-decoration: underline;"
              >
                {{ data.productName }}
              </span>
            </template>
          </Column>

          <Column field="supplierName" :header="t('inventory.table.primarySupplier')" sortable>
            <template #body="{ data }">
              <Tag :value="data.supplierName" severity="info" />
            </template>
          </Column>

          <Column field="totalQuantity" :header="t('inventory.table.totalQuantity')" sortable style="width: 180px">
            <template #body="{ data }">
              <Tag
                :value="`${n(data.totalQuantity, 'quantity')} ${data.productUnit}`"
                :severity="getQuantitySeverity(data.totalQuantity)"
                :icon="getQuantityIcon(data.totalQuantity)"
              />
            </template>
          </Column>

          <Column field="averageUnitCost" :header="t('inventory.table.avgUnitCost')" sortable style="width: 150px">
            <template #body="{ data }">
              {{ formatCurrency(data.averageUnitCost) }}
            </template>
          </Column>

          <Column field="totalValue" :header="t('inventory.table.totalValue')" sortable style="width: 150px">
            <template #body="{ data }">
              <strong>{{ formatCurrency(data.totalValue) }}</strong>
            </template>
          </Column>

          <Column field="lotCount" :header="t('inventory.table.lots')" sortable style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data.lotCount" severity="secondary" />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 100px">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                size="small"
                text
                rounded
                @click="viewLots(data)"
                v-tooltip.top="t('inventory.viewFifoLots')"
              />
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
              <p>{{ t('common.noRecordsFound') }}</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- FIFO Lots Dialog -->
    <Dialog
      v-model:visible="lotsDialogVisible"
      :header="t('inventory.lotsDialog.header', { productName: selectedProduct?.productName })"
      modal
      :style="{ width: '90vw', maxWidth: '1000px' }"
    >
      <div v-if="selectedProduct" class="lots-dialog-content">
        <div class="product-summary">
          <div class="summary-item">
            <strong>{{ t('inventory.lotsDialog.supplier') }}:</strong> {{ selectedProduct.supplierName }}
          </div>
          <div class="summary-item">
            <strong>{{ t('inventory.lotsDialog.totalQuantity') }}:</strong> {{ n(selectedProduct.totalQuantity, 'quantity') }} {{ selectedProduct.productUnit }}
          </div>
          <div class="summary-item">
            <strong>{{ t('inventory.lotsDialog.avgUnitCost') }}:</strong> {{ formatCurrency(selectedProduct.averageUnitCost) }}
          </div>
          <div class="summary-item">
            <strong>{{ t('inventory.lotsDialog.totalValue') }}:</strong> {{ formatCurrency(selectedProduct.totalValue) }}
          </div>
        </div>

        <h4>{{ t('inventory.lotsDialog.purchaseLotsHeader') }}</h4>
        <DataTable :value="selectedProduct.lots" size="small" stripedRows>
          <Column field="purchaseDate" :header="t('inventory.lotsDialog.purchaseDate')" sortable>
            <template #body="{ data }">
              {{ formatDate(data.purchaseDate) }}
            </template>
          </Column>

          <Column field="supplier.name" :header="t('inventory.lotsDialog.supplier')">
            <template #body="{ data }">
              {{ data.supplier?.name || t('common.unknown') }}
            </template>
          </Column>

          <Column field="quantity" :header="t('inventory.lotsDialog.originalQty')">
            <template #body="{ data }">
              {{ n(data.quantity, 'quantity') }}
            </template>
          </Column>

          <Column field="remainingQuantity" :header="t('inventory.lotsDialog.remainingQty')">
            <template #body="{ data }">
              <Tag
                :value="n(data.remainingQuantity, 'quantity')"
                :severity="data.remainingQuantity > 0 ? 'success' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="unitCost" :header="t('inventory.lotsDialog.unitCost')">
            <template #body="{ data }">
              {{ formatCurrency(data.unitCost) }}
            </template>
          </Column>

          <Column :header="t('inventory.lotsDialog.lotValue')">
            <template #body="{ data }">
              <strong>{{ formatCurrency(data.remainingQuantity * data.unitCost) }}</strong>
            </template>
          </Column>

          <Column field="year" :header="t('inventory.lotsDialog.year')">
            <template #body="{ data }">
              <Tag :value="data.year" severity="secondary" />
            </template>
          </Column>

          <template #empty>
            <div class="empty-lots">{{ t('inventory.lotsDialog.noLotsAvailable') }}</div>
          </template>
        </DataTable>
      </div>

      <template #footer>
        <Button :label="t('common.close')" @click="lotsDialogVisible = false" />
      </template>
    </Dialog>

    <!-- Purchase History Dialog -->
    <Dialog
      v-model:visible="historyDialogVisible"
      :header="t('products.history.title', { name: selectedProduct?.productName || '' })"
      modal
      :style="{ width: '900px' }"
    >
      <div v-if="loadingHistory" class="loading-container">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>
      <div v-else-if="productHistory" class="history-container">
        <!-- Current Inventory Summary -->
        <div class="inventory-summary">
          <h3>{{ t('products.history.currentInventory') }} - {{ t('products.history.asOfToday') }}</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <label>{{ t('products.history.expectedQuantity') }}:</label>
              <span class="value">{{ productHistory.currentQuantity || 0 }} {{ selectedProduct?.productUnit }}</span>
            </div>
            <div v-if="productHistory.lastYearEndCount" class="summary-item">
              <label>{{ t('products.history.actualQuantity') }}:</label>
              <span class="value">{{ productHistory.lastYearEndCount.countedQuantity || 0 }} {{ selectedProduct?.productUnit }}</span>
            </div>
          </div>
        </div>

        <!-- Purchase History Table -->
        <div class="purchase-history">
          <h3>{{ t('products.history.purchaseHistory') }}</h3>
          <DataTable
            v-if="productHistory.purchases && productHistory.purchases.length > 0"
            :value="productHistory.purchases"
            stripedRows
            :rows="10"
            paginator
          >
            <Column :header="t('products.history.purchaseDate')" style="width: 120px">
              <template #body="{ data }">
                {{ formatDate(data.purchaseDate) }}
              </template>
            </Column>
            <Column field="year" :header="t('products.history.year')" style="width: 80px" />
            <Column :header="t('products.history.supplier')">
              <template #body="{ data }">
                {{ JSON.parse(data.supplierSnapshot).name }}
              </template>
            </Column>
            <Column field="quantity" :header="t('products.history.quantity')" style="width: 100px" />
            <Column field="remainingQuantity" :header="t('products.history.remaining')" style="width: 100px" />
            <Column :header="t('products.history.unitCost')" style="width: 120px">
              <template #body="{ data }">
                {{ formatCurrency(data.unitCostExclVAT || data.unitCost) }}
              </template>
            </Column>
            <Column :header="t('products.history.totalCost')" style="width: 120px">
              <template #body="{ data }">
                {{ formatCurrency((data.unitCostExclVAT || data.unitCost) * data.quantity) }}
              </template>
            </Column>
          </DataTable>
          <div v-else class="no-data">
            {{ t('products.history.noPurchases') }}
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';
import { useCurrency } from '@/composables/useCurrency';

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
const { t, n, d } = useI18n();
const { formatCurrency } = useCurrency();

const inventoryItems = ref<InventoryItem[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showZeroQuantity = ref(false);
const lotsDialogVisible = ref(false);
const selectedProduct = ref<InventoryItem | null>(null);

// Purchase History Dialog state
const historyDialogVisible = ref(false);
const loadingHistory = ref(false);
const productHistory = ref<any>(null);

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

        // Determine supplier display name
        let supplierName = t('common.unknown');
        if (product.suppliers && product.suppliers.length > 0) {
          if (product.suppliers.length === 1) {
            supplierName = product.suppliers[0].supplier.name;
          } else {
            // Show all supplier names, comma-separated
            supplierName = product.suppliers.map(s => s.supplier.name).join(', ');
          }
        }
        
        return {
          productId: product.id,
          productName: product.name,
          productUnit: product.unit?.name || t('units.names.pieces'),
          supplierName,
          totalQuantity,
          averageUnitCost,
          totalValue,
          lotCount: lots.filter(lot => lot.remainingQuantity > 0).length,
          lots: lots.filter(lot => lot.remainingQuantity > 0), // Only show lots with remaining quantity
        };
      } catch (error) {
        console.error(`Failed to fetch lots for product ${product.id}:`, error);
        
        // Determine supplier display name for error case
        let supplierName = t('common.unknown');
        if (product.suppliers && product.suppliers.length > 0) {
          if (product.suppliers.length === 1) {
            supplierName = product.suppliers[0].supplier.name;
          } else {
            // Show all supplier names, comma-separated
            supplierName = product.suppliers.map(s => s.supplier.name).join(', ');
          }
        }
        
        return {
          productId: product.id,
          productName: product.name,
          productUnit: product.unit?.name || t('units.names.pieces'),
          supplierName,
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
      summary: t('common.error'),
      detail: error.response?.data?.error || t('inventory.messages.loadFailed'),
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

// Open purchase history dialog
const openHistoryDialog = async (item: InventoryItem) => {
  selectedProduct.value = item;
  historyDialogVisible.value = true;
  await fetchProductHistory(item.productId);
};

// Fetch product purchase history
const fetchProductHistory = async (productId: number) => {
  loadingHistory.value = true;
  try {
    const response = await api.get(`/products/${productId}`);
    productHistory.value = {
      currentQuantity: response.data.purchaseLots?.reduce((sum: number, lot: any) => sum + lot.remainingQuantity, 0) || 0,
      purchases: response.data.purchaseLots || [],
      lastYearEndCount: null, // Will be populated if we have year-end count data
    };
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.history.loadFailed'),
      life: 3000,
    });
    productHistory.value = null;
  } finally {
    loadingHistory.value = false;
  }
};

// Format date - import utility
import { formatDate } from '@/utils/dateFormatter';

// Visual feedback helpers for quantity status
const getQuantitySeverity = (quantity: number): string => {
  if (quantity === 0) return 'danger';   // Red - OUT OF STOCK
  if (quantity < 10) return 'warning';   // Orange - LOW STOCK
  return 'success';                      // Green - NORMAL
};

const getQuantityIcon = (quantity: number): string => {
  if (quantity === 0) return 'pi pi-times-circle';         // X icon for zero
  if (quantity < 10) return 'pi pi-exclamation-triangle'; // Warning for low
  return 'pi pi-check-circle';                            // Check for normal
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

/* Purchase History Dialog Styles */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.history-container {
  padding: 0.5rem 0;
}

.inventory-summary {
  background: var(--surface-50);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.inventory-summary h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-grid .summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-grid .summary-item label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.summary-grid .summary-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.purchase-history {
  margin-top: 1.5rem;
}

.purchase-history h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color-secondary);
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.product-name-link {
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.product-name-link:hover {
  opacity: 0.8;
}
</style>
