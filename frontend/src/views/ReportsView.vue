<template>
  <div class="reports-view">
    <div class="header">
      <h1>{{ t('reports.title') }}</h1>
    </div>

    <div class="reports-grid">
      <!-- Inventory Valuation Report -->
      <Card>
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <i class="pi pi-chart-line"></i>
              <span>{{ t('reports.inventoryValuation.title') }}</span>
            </div>
          </div>
        </template>
        <template #content>
          <p class="card-description">
            {{ t('reports.inventoryValuation.description') }}
          </p>
          <Button
            :label="t('reports.generateReport')"
            icon="pi pi-file-pdf"
            @click="generateInventoryValuationReport"
            :loading="loadingInventoryReport"
            class="report-button"
          />
        </template>
      </Card>

      <!-- Purchase History Report -->
      <Card>
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <i class="pi pi-shopping-cart"></i>
              <span>{{ t('reports.purchaseHistory.title') }}</span>
            </div>
          </div>
        </template>
        <template #content>
          <p class="card-description">
            {{ t('reports.purchaseHistory.description') }}
          </p>
          <div class="date-range-selector">
            <div class="date-field">
              <label>{{ t('reports.purchaseHistory.fromDate') }}</label>
              <DatePicker
                v-model="purchaseReportDates.from"
                dateFormat="yy-mm-dd"
                showIcon
              />
            </div>
            <div class="date-field">
              <label>{{ t('reports.purchaseHistory.toDate') }}</label>
              <DatePicker
                v-model="purchaseReportDates.to"
                dateFormat="yy-mm-dd"
                showIcon
              />
            </div>
          </div>
          <Button
            :label="t('reports.exportCSV')"
            icon="pi pi-download"
            @click="exportPurchaseHistory"
            :loading="loadingPurchaseReport"
            :disabled="!purchaseReportDates.from || !purchaseReportDates.to"
            class="report-button"
          />
        </template>
      </Card>

      <!-- Year-End Count Reports -->
      <Card>
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <i class="pi pi-calendar"></i>
              <span>{{ t('reports.yearEndCount.title') }}</span>
            </div>
          </div>
        </template>
        <template #content>
          <p class="card-description">
            {{ t('reports.yearEndCount.description') }}
          </p>
          <div class="year-selector">
            <Dropdown
              v-model="selectedYearForReport"
              :options="availableYears"
              :placeholder="t('reports.yearEndCount.selectYear')"
              :loading="loadingYears"
            />
          </div>
          <Button
            :label="t('reports.viewReport')"
            icon="pi pi-eye"
            @click="viewYearEndReport"
            :loading="loadingYearEndReport"
            :disabled="!selectedYearForReport"
            class="report-button"
          />
        </template>
      </Card>

      <!-- Product Activity Report -->
      <Card>
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <i class="pi pi-box"></i>
              <span>{{ t('reports.productActivity.title') }}</span>
            </div>
          </div>
        </template>
        <template #content>
          <p class="card-description">
            {{ t('reports.productActivity.description') }}
          </p>
          <Button
            :label="t('reports.generateSummary')"
            icon="pi pi-list"
            @click="generateProductActivityReport"
            :loading="loadingProductReport"
            class="report-button"
          />
        </template>
      </Card>
    </div>

    <!-- Inventory Valuation Detail Dialog -->
    <Dialog
      v-model:visible="inventoryReportDialogVisible"
      :header="t('reports.inventoryValuation.dialogHeader')"
      modal
      :style="{ width: '90vw', maxWidth: '1200px' }"
    >
      <div class="report-content">
        <div class="report-summary">
          <div class="summary-item">
            <strong>{{ t('reports.reportDate') }}:</strong>
            <span>{{ d(new Date(), 'short') }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.totalInventoryValue') }}:</strong>
            <span class="value-highlight">{{ n(inventoryReportData.totalValue, 'currency') }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.totalProducts') }}:</strong>
            <span>{{ n(inventoryReportData.items.length, 'integer') }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.totalUnits') }}:</strong>
            <span>{{ n(inventoryReportData.totalUnits, 'integer') }}</span>
          </div>
        </div>

        <DataTable
          :value="inventoryReportData.items"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <Column field="productName" :header="t('reports.product')" sortable />
          <Column field="supplierName" :header="t('reports.supplier')" sortable />
          <Column field="quantity" :header="t('reports.quantity')" sortable>
            <template #body="{ data }">
              {{ n(data.quantity, 'integer') }}
            </template>
          </Column>
          <Column field="averageUnitCost" :header="t('reports.avgUnitCost')" sortable>
            <template #body="{ data }">
              {{ n(data.averageUnitCost, 'currency') }}
            </template>
          </Column>
          <Column field="totalValue" :header="t('reports.totalValue')" sortable>
            <template #body="{ data }">
              <strong>{{ n(data.totalValue, 'currency') }}</strong>
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <Button :label="t('common.close')" text @click="inventoryReportDialogVisible = false" />
        <Button :label="t('reports.exportCSV')" icon="pi pi-download" @click="exportInventoryReportCSV" />
      </template>
    </Dialog>

    <!-- Product Activity Detail Dialog -->
    <Dialog
      v-model:visible="productActivityDialogVisible"
      :header="t('reports.productActivity.dialogHeader')"
      modal
      :style="{ width: '90vw', maxWidth: '1200px' }"
    >
      <div class="report-content">
        <DataTable
          :value="productActivityData"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <Column field="productName" :header="t('reports.product')" sortable />
          <Column field="supplierName" :header="t('reports.supplier')" sortable />
          <Column field="purchaseCount" :header="t('reports.purchases')" sortable>
            <template #body="{ data }">
              <Tag :value="data.purchaseCount" severity="info" />
            </template>
          </Column>
          <Column field="currentInventory" :header="t('reports.currentInventory')" sortable>
            <template #body="{ data }">
              <Tag
                :value="n(data.currentInventory, 'integer')"
                :severity="data.currentInventory > 0 ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column field="inventoryValue" :header="t('reports.inventoryValue')" sortable>
            <template #body="{ data }">
              {{ n(data.inventoryValue, 'currency') }}
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <Button :label="t('common.close')" text @click="productActivityDialogVisible = false" />
        <Button :label="t('reports.exportCSV')" icon="pi pi-download" @click="exportProductActivityCSV" />
      </template>
    </Dialog>

    <!-- Year-End Count Report Dialog -->
    <Dialog
      v-model:visible="yearEndReportDialogVisible"
      :header="t('reports.yearEndCount.dialogHeader', { year: yearEndReportData?.year || '' })"
      modal
      :style="{ width: '90vw', maxWidth: '1200px' }"
    >
      <div v-if="yearEndReportData" class="report-content">
        <div class="report-summary">
          <div class="summary-item">
            <strong>{{ t('reports.year') }}:</strong>
            <span>{{ yearEndReportData.year }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.confirmedDate') }}:</strong>
            <span>{{ d(new Date(yearEndReportData.confirmedAt), 'short') }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.totalProducts') }}:</strong>
            <span>{{ n(yearEndReportData.items?.length || 0, 'integer') }}</span>
          </div>
          <div class="summary-item">
            <strong>{{ t('reports.totalVariance') }}:</strong>
            <span :class="getTotalVariance() >= 0 ? 'text-success' : 'text-danger'">
              {{ getTotalVariance() >= 0 ? '+' : '' }}{{ n(getTotalVariance(), 'integer') }}
            </span>
          </div>
        </div>

        <DataTable
          :value="yearEndReportData.items"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <Column field="product.name" :header="t('reports.product')" sortable />
          
          <Column field="expectedQuantity" :header="t('reports.expected')" sortable>
            <template #body="{ data }">
              {{ n(data.expectedQuantity, 'integer') }}
            </template>
          </Column>

          <Column field="countedQuantity" :header="t('reports.counted')" sortable>
            <template #body="{ data }">
              {{ data.countedQuantity ? n(data.countedQuantity, 'integer') : '—' }}
            </template>
          </Column>

          <Column field="variance" :header="t('reports.variance')" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.variance >= 0 ? `+${data.variance}` : String(data.variance)"
                :severity="data.variance === 0 ? 'secondary' : data.variance > 0 ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column field="value" :header="t('reports.value')" sortable>
            <template #body="{ data }">
              {{ n(data.value || 0, 'currency') }}
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <Button :label="t('common.close')" text @click="yearEndReportDialogVisible = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import DatePicker from 'primevue/datepicker';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

interface InventoryReportItem {
  productName: string;
  supplierName: string;
  quantity: number;
  averageUnitCost: number;
  totalValue: number;
}

interface ProductActivityItem {
  productName: string;
  supplierName: string;
  purchaseCount: number;
  currentInventory: number;
  inventoryValue: number;
}

const toast = useToast();
const { t, n, d } = useI18n();
const router = useRouter();

const loadingInventoryReport = ref(false);
const loadingPurchaseReport = ref(false);
const loadingYearEndReport = ref(false);
const loadingProductReport = ref(false);
const loadingYears = ref(false);

const inventoryReportDialogVisible = ref(false);
const productActivityDialogVisible = ref(false);
const yearEndReportDialogVisible = ref(false);

const purchaseReportDates = ref({
  from: null as Date | null,
  to: null as Date | null,
});

const selectedYearForReport = ref<number | null>(null);
const availableYears = ref<number[]>([]);

const inventoryReportData = ref({
  totalValue: 0,
  totalUnits: 0,
  items: [] as InventoryReportItem[],
});

const productActivityData = ref<ProductActivityItem[]>([]);

const yearEndReportData = ref<any>(null);

// Generate Inventory Valuation Report
const generateInventoryValuationReport = async () => {
  loadingInventoryReport.value = true;
  try {
    // Fetch all products
    const productsResponse = await api.get('/products');
    const products = productsResponse.data;

    // Fetch inventory for each product
    const items: InventoryReportItem[] = [];
    let totalValue = 0;
    let totalUnits = 0;

    for (const product of products) {
      try {
        const lotsResponse = await api.get(`/inventory/lots/${product.id}`);
        const lots = lotsResponse.data;

        const quantity = lots.reduce((sum: number, lot: any) => sum + lot.remainingQuantity, 0);
        const value = lots.reduce((sum: number, lot: any) => sum + (lot.remainingQuantity * lot.unitCost), 0);
        const averageUnitCost = quantity > 0 ? value / quantity : 0;

        if (quantity > 0) {
          items.push({
            productName: product.name,
            supplierName: product.supplier?.name || t('common.unknown'),
            quantity,
            averageUnitCost,
            totalValue: value,
          });

          totalValue += value;
          totalUnits += quantity;
        }
      } catch (error) {
        console.error(`Failed to fetch inventory for product ${product.id}:`, error);
      }
    }

    inventoryReportData.value = {
      totalValue,
      totalUnits,
      items: items.sort((a, b) => b.totalValue - a.totalValue),
    };

    inventoryReportDialogVisible.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || t('reports.messages.generateInventoryFailed'),
      life: 3000,
    });
  } finally {
    loadingInventoryReport.value = false;
  }
};

// Export Inventory Report to CSV
const exportInventoryReportCSV = () => {
  const headers = ['Product', 'Supplier', 'Quantity', 'Avg Unit Cost', 'Total Value'];
  const rows = inventoryReportData.value.items.map(item => [
    item.productName,
    item.supplierName,
    item.quantity,
    item.averageUnitCost.toFixed(2),
    item.totalValue.toFixed(2),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    '',
    `Total Value,,,,$${inventoryReportData.value.totalValue.toFixed(2)}`,
    `Total Units,,${inventoryReportData.value.totalUnits},,`,
  ].join('\n');

  downloadCSV(csv, `inventory-valuation-${new Date().toISOString().split('T')[0]}.csv`);
};

// Export Purchase History
const exportPurchaseHistory = async () => {
  if (!purchaseReportDates.value.from || !purchaseReportDates.value.to) {
    return;
  }

  loadingPurchaseReport.value = true;
  try {
    const response = await api.get('/purchases');
    const purchases = response.data;

    const fromDate = new Date(purchaseReportDates.value.from);
    const toDate = new Date(purchaseReportDates.value.to);

    const filtered = purchases.filter((p: any) => {
      const pDate = new Date(p.purchaseDate);
      return pDate >= fromDate && pDate <= toDate;
    });

    const headers = ['Purchase Date', 'Product', 'Supplier', 'Quantity', 'Unit Cost', 'Total Cost', 'Year'];
    const rows = filtered.map((p: any) => [
      p.purchaseDate,
      p.product?.name || 'Unknown',
      p.supplier?.name || 'Unknown',
      p.quantity,
      p.unitCost.toFixed(2),
      (p.quantity * p.unitCost).toFixed(2),
      p.year,
    ]);

    const csv = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');

    downloadCSV(csv, `purchase-history-${fromDate.toISOString().split('T')[0]}-to-${toDate.toISOString().split('T')[0]}.csv`);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Exported ${filtered.length} purchase records`,
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || t('reports.messages.exportPurchaseFailed'),
      life: 3000,
    });
  } finally {
    loadingPurchaseReport.value = false;
  }
};

// View Year-End Report
const viewYearEndReport = async () => {
  if (!selectedYearForReport.value) {
    return;
  }

  loadingYearEndReport.value = true;
  try {
    // Fetch the year-end count for the selected year
    const response = await api.get(`/year-end-count/${selectedYearForReport.value}`);
    const yearEndCount = response.data;

    if (!yearEndCount || yearEndCount.status !== 'confirmed') {
      toast.add({
        severity: 'warn',
        summary: 'Not Available',
        detail: `No confirmed year-end count found for year ${selectedYearForReport.value}`,
        life: 5000,
      });
      return;
    }

    // Fetch the detailed report
    const reportResponse = await api.get(`/year-end-count/${yearEndCount.id}/report`);
    yearEndReportData.value = {
      year: selectedYearForReport.value,
      confirmedAt: yearEndCount.confirmedAt,
      ...reportResponse.data,
    };

    yearEndReportDialogVisible.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || t('reports.messages.loadYearEndFailed'),
      life: 3000,
    });
  } finally {
    loadingYearEndReport.value = false;
  }
};

// Fetch available years (from confirmed year-end counts)
const fetchAvailableYears = async () => {
  loadingYears.value = true;
  try {
    // Fetch all year-end counts
    const response = await api.get('/year-end-count/all');
    const counts = response.data;

    // Filter for confirmed counts and extract years
    const years: number[] = counts
      .filter((c: any) => c.status === 'confirmed')
      .map((c: any) => c.year)
      .sort((a: number, b: number) => b - a); // Newest first

    availableYears.value = years;
  } catch (error) {
    console.error('Failed to fetch available years:', error);
  } finally {
    loadingYears.value = false;
  }
};

// Generate Product Activity Report
const generateProductActivityReport = async () => {
  loadingProductReport.value = true;
  try {
    const productsResponse = await api.get('/products');
    const products = productsResponse.data;

    const activityData: ProductActivityItem[] = [];

    for (const product of products) {
      try {
        const lotsResponse = await api.get(`/inventory/lots/${product.id}`);
        const lots = lotsResponse.data;

        const currentInventory = lots.reduce((sum: number, lot: any) => sum + lot.remainingQuantity, 0);
        const inventoryValue = lots.reduce((sum: number, lot: any) => sum + (lot.remainingQuantity * lot.unitCost), 0);
        const purchaseCount = product._count?.purchases || 0;

        activityData.push({
          productName: product.name,
          supplierName: product.supplier?.name || t('common.unknown'),
          purchaseCount,
          currentInventory,
          inventoryValue,
        });
      } catch (error) {
        console.error(`Failed to fetch data for product ${product.id}:`, error);
      }
    }

    productActivityData.value = activityData.sort((a, b) => b.inventoryValue - a.inventoryValue);
    productActivityDialogVisible.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || t('reports.messages.generateProductActivityFailed'),
      life: 3000,
    });
  } finally {
    loadingProductReport.value = false;
  }
};

// Export Product Activity to CSV
const exportProductActivityCSV = () => {
  const headers = ['Product', 'Supplier', 'Purchase Count', 'Current Inventory', 'Inventory Value'];
  const rows = productActivityData.value.map(item => [
    item.productName,
    item.supplierName,
    item.purchaseCount,
    item.currentInventory,
    item.inventoryValue.toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  downloadCSV(csv, `product-activity-${new Date().toISOString().split('T')[0]}.csv`);
};

// Utility: Download CSV
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// Get total variance from year-end report
const getTotalVariance = () => {
  if (!yearEndReportData.value?.items) return 0;
  return yearEndReportData.value.items.reduce((sum: number, item: any) => sum + (item.variance || 0), 0);
};



// Load data on mount
onMounted(() => {
  fetchAvailableYears();
});
</script>

<style scoped>
.reports-view {
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.card-header {
  padding: 1.5rem 1.5rem 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.card-title i {
  color: var(--primary-color);
}

.card-description {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
  min-height: 3rem;
}

.report-button {
  width: 100%;
}

.date-range-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-field label {
  font-weight: 600;
  font-size: 0.875rem;
}

.year-selector {
  margin-bottom: 1.5rem;
}

.report-content {
  margin-top: 1rem;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item strong {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.summary-item span {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.value-highlight {
  color: var(--primary-color) !important;
  font-size: 1.5rem !important;
}

.text-success {
  color: var(--green-600) !important;
}

.text-danger {
  color: var(--red-600) !important;
}
</style>
