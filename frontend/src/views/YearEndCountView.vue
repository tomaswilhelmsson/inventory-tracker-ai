<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import api from '../services/api';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import ProgressBar from 'primevue/progressbar';
import FileUpload from 'primevue/fileupload';
import Message from 'primevue/message';

const toast = useToast();

const loading = ref(false);
const countSheet = ref<any>(null);
const showConfirmDialog = ref(false);
const showReportDialog = ref(false);
const reportData = ref<any>(null);
const currentYear = new Date().getFullYear();

const progress = computed(() => {
  if (!countSheet.value?.progress) return 0;
  return countSheet.value.progress.percentage;
});

const countedItems = computed(() => {
  if (!countSheet.value?.progress) return 0;
  return countSheet.value.progress.counted;
});

const totalItems = computed(() => {
  if (!countSheet.value?.progress) return 0;
  return countSheet.value.progress.total;
});

const uncountedItems = computed(() => {
  if (!countSheet.value?.items) return [];
  return countSheet.value.items.filter((item: any) => item.countedQuantity === null);
});

const isCountComplete = computed(() => {
  return uncountedItems.value.length === 0;
});

async function initiateCount() {
  loading.value = true;
  try {
    const response = await api.post('/year-end-count', { year: currentYear });
    await loadCountSheet(response.data.id);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Year-end count for ${currentYear} initiated`,
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to initiate count',
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

async function loadCountSheet(countId: number) {
  loading.value = true;
  try {
    const response = await api.get(`/year-end-count/${countId}/sheet`);
    countSheet.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to load count sheet',
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

async function loadExistingCount() {
  loading.value = true;
  try {
    const response = await api.get(`/year-end-count/${currentYear}`);
    countSheet.value = response.data;
    
    // Get the full count sheet
    await loadCountSheet(response.data.id);
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No count exists yet
      countSheet.value = null;
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.error || 'Failed to load count',
        life: 5000,
      });
    }
  } finally {
    loading.value = false;
  }
}

async function updateCountItem(item: any) {
  try {
    await api.put(`/year-end-count/${countSheet.value.id}/items/${item.productId}`, {
      countedQuantity: item.countedQuantity,
    });

    // Refresh count sheet to get updated variance and value
    await loadCountSheet(countSheet.value.id);

    toast.add({
      severity: 'success',
      summary: 'Saved',
      detail: `Count updated for ${item.product.name}`,
      life: 2000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to update count',
      life: 5000,
    });
  }
}

async function exportCSV() {
  try {
    const response = await api.get(`/year-end-count/${countSheet.value.id}/export-csv`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `count-sheet-${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Count sheet exported to CSV',
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to export CSV',
      life: 5000,
    });
  }
}

async function exportPDF() {
  try {
    const response = await api.get(`/year-end-count/${countSheet.value.id}/export-pdf`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `count-sheet-${currentYear}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Count sheet exported to PDF',
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to export PDF',
      life: 5000,
    });
  }
}

async function onUploadCSV(event: any) {
  const file = event.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(`/year-end-count/${countSheet.value.id}/import-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    await loadCountSheet(countSheet.value.id);

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Imported ${response.data.results.successful} items successfully`,
      life: 5000,
    });

    if (response.data.results.failed > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `${response.data.results.failed} items failed. Check console for details.`,
        life: 5000,
      });
      console.error('Import errors:', response.data.results.errors);
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to import CSV',
      life: 5000,
    });
  }
}

async function previewReport() {
  try {
    const response = await api.get(`/year-end-count/${countSheet.value.id}/report`);
    reportData.value = response.data;
    showReportDialog.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to generate report',
      life: 5000,
    });
  }
}

async function confirmCount() {
  if (!isCountComplete.value) {
    toast.add({
      severity: 'error',
      summary: 'Incomplete Count',
      detail: `Please count all products. ${uncountedItems.value.length} products remaining.`,
      life: 5000,
    });
    return;
  }

  // Load report data first
  await previewReport();
  showConfirmDialog.value = true;
}

async function finalizeCount() {
  loading.value = true;
  try {
    const response = await api.post(`/year-end-count/${countSheet.value.id}/confirm`);
    
    toast.add({
      severity: 'success',
      summary: 'Count Confirmed',
      detail: response.data.message,
      life: 5000,
    });

    showConfirmDialog.value = false;
    await loadExistingCount();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to confirm count',
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

function getVarianceClass(variance: number | null) {
  if (variance === null) return '';
  if (variance === 0) return 'variance-exact';
  if (variance > 0) return 'variance-surplus';
  return 'variance-shortage';
}

function getVarianceIcon(variance: number | null) {
  if (variance === null) return 'pi-minus';
  if (variance === 0) return 'pi-check';
  if (variance > 0) return 'pi-arrow-up';
  return 'pi-arrow-down';
}

onMounted(() => {
  loadExistingCount();
});
</script>

<template>
  <div class="year-end-count">
    <div class="header">
      <h1>Year-End Inventory Count - {{ currentYear }}</h1>
      <div class="actions" v-if="!countSheet">
        <Button
          label="Initiate Year-End Count"
          icon="pi pi-plus"
          @click="initiateCount"
          :loading="loading"
          severity="success"
        />
      </div>
    </div>

    <div v-if="!countSheet && !loading" class="empty-state">
      <Card>
        <template #content>
          <div class="empty-content">
            <i class="pi pi-inbox" style="font-size: 4rem; color: #ccc"></i>
            <h2>No Year-End Count in Progress</h2>
            <p>Click "Initiate Year-End Count" to start the {{ currentYear }} inventory count process.</p>
          </div>
        </template>
      </Card>
    </div>

    <div v-if="countSheet" class="count-sheet">
      <!-- Progress Bar -->
      <Card class="progress-card">
        <template #content>
          <div class="progress-section">
            <div class="progress-info">
              <h3>Progress: {{ countedItems }} / {{ totalItems }} products counted</h3>
              <span class="percentage">{{ progress }}%</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" />
            <div v-if="uncountedItems.length > 0" class="uncounted-warning">
              <Message severity="warn" :closable="false">
                {{ uncountedItems.length }} products still need to be counted
              </Message>
            </div>
            <div v-else>
              <Message severity="success" :closable="false">
                All products counted! Ready to confirm.
              </Message>
            </div>
          </div>
        </template>
      </Card>

      <!-- Action Buttons -->
      <Card class="actions-card">
        <template #content>
          <div class="action-buttons">
            <Button
              label="Export to CSV"
              icon="pi pi-file"
              @click="exportCSV"
              outlined
            />
            <Button
              label="Export to PDF"
              icon="pi pi-file-pdf"
              @click="exportPDF"
              outlined
            />
            <FileUpload
              mode="basic"
              accept=".csv"
              :maxFileSize="1000000"
              @select="onUploadCSV"
              :auto="true"
              chooseLabel="Import CSV"
              customUpload
            />
            <Button
              label="Preview Report"
              icon="pi pi-eye"
              @click="previewReport"
              severity="info"
            />
            <Button
              label="Confirm Count"
              icon="pi pi-check"
              @click="confirmCount"
              severity="success"
              :disabled="!isCountComplete || countSheet.status === 'confirmed'"
            />
          </div>
        </template>
      </Card>

      <!-- Count Sheet Table -->
      <Card>
        <template #title>
          <div class="table-header">
            <span>Count Sheet</span>
            <span v-if="countSheet.status === 'confirmed'" class="status-badge confirmed">
              <i class="pi pi-lock"></i> Confirmed & Locked
            </span>
            <span v-else class="status-badge draft">
              <i class="pi pi-pencil"></i> Draft
            </span>
          </div>
        </template>
        <template #content>
          <DataTable
            :value="countSheet.items"
            :loading="loading"
            stripedRows
            :paginator="true"
            :rows="20"
            sortField="product.name"
            :sortOrder="1"
          >
            <Column field="product.name" header="Product Name" sortable>
              <template #body="{ data }">
                <div class="product-cell">
                  <span class="product-name">{{ data.product.name }}</span>
                  <span class="supplier-name">{{ data.product.supplier.name }}</span>
                </div>
              </template>
            </Column>

            <Column field="expectedQuantity" header="Expected Quantity" sortable>
              <template #body="{ data }">
                <span class="expected-qty">{{ data.expectedQuantity }} {{ data.product?.unit?.name || 'pieces' }}</span>
              </template>
            </Column>

            <Column field="countedQuantity" header="Actual Count">
              <template #body="{ data }">
                <InputNumber
                  v-model="data.countedQuantity"
                  @blur="updateCountItem(data)"
                  :min="0"
                  :disabled="countSheet.status === 'confirmed'"
                  :class="{ 'uncounted': data.countedQuantity === null }"
                  placeholder="Enter count"
                />
              </template>
            </Column>

            <Column field="variance" header="Variance" sortable>
              <template #body="{ data }">
                <div v-if="data.variance !== null" :class="['variance', getVarianceClass(data.variance)]">
                  <i :class="['pi', getVarianceIcon(data.variance)]"></i>
                  <span>{{ data.variance >= 0 ? '+' : '' }}{{ data.variance }} {{ data.product?.unit?.name || 'pieces' }}</span>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>

            <Column field="value" header="Value (FIFO)" sortable>
              <template #body="{ data }">
                <span v-if="data.value !== null" class="value">
                  ${{ data.value.toFixed(2) }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Confirm Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      header="Confirm Year-End Count"
      :modal="true"
      :closable="!loading"
    >
      <div class="confirm-content">
        <Message severity="warn" :closable="false">
          <strong>Warning:</strong> Confirming this count will:
          <ul>
            <li>Update all inventory lots using FIFO (oldest first)</li>
            <li>Lock year {{ currentYear }} to prevent further edits</li>
            <li>Create a database backup</li>
          </ul>
          This action cannot be undone!
        </Message>

        <div v-if="reportData" class="summary">
          <h3>Summary:</h3>
          <p><strong>Total Expected:</strong> {{ reportData.totalExpected }}</p>
          <p><strong>Total Counted:</strong> {{ reportData.totalCounted }}</p>
          <p><strong>Total Variance:</strong> {{ reportData.totalVariance }}</p>
          <p><strong>Total Value:</strong> ${{ reportData.totalValue?.toFixed(2) }}</p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="showConfirmDialog = false"
          text
          :disabled="loading"
        />
        <Button
          label="Confirm & Lock Year"
          icon="pi pi-check"
          @click="finalizeCount"
          severity="danger"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- Report Dialog -->
    <Dialog
      v-model:visible="showReportDialog"
      header="Year-End Inventory Report Preview"
      :modal="true"
      :style="{ width: '80vw' }"
    >
      <div v-if="reportData" class="report-preview">
        <div class="report-summary">
          <h3>Year {{ reportData.year }} - {{ reportData.status.toUpperCase() }}</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <label>Total Expected:</label>
              <span>{{ reportData.totalExpected }}</span>
            </div>
            <div class="summary-item">
              <label>Total Counted:</label>
              <span>{{ reportData.totalCounted }}</span>
            </div>
            <div class="summary-item">
              <label>Total Variance:</label>
              <span :class="reportData.totalVariance >= 0 ? 'text-success' : 'text-danger'">
                {{ reportData.totalVariance >= 0 ? '+' : '' }}{{ reportData.totalVariance }}
              </span>
            </div>
            <div class="summary-item">
              <label>Total Value:</label>
              <span class="value-large">${{ reportData.totalValue?.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <DataTable :value="reportData.items" :paginator="true" :rows="10">
          <Column field="productName" header="Product" sortable />
          <Column field="expectedQuantity" header="Expected" sortable />
          <Column field="countedQuantity" header="Counted" sortable />
          <Column field="variance" header="Variance" sortable>
            <template #body="{ data }">
              <span :class="data.variance >= 0 ? 'text-success' : 'text-danger'">
                {{ data.variance >= 0 ? '+' : '' }}{{ data.variance }}
              </span>
            </template>
          </Column>
          <Column field="value" header="Value" sortable>
            <template #body="{ data }">
              ${{ data.value?.toFixed(2) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.year-end-count {
  max-width: 1400px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #333;
}

.empty-state {
  margin-top: 3rem;
}

.empty-content {
  text-align: center;
  padding: 3rem;
}

.empty-content h2 {
  color: #666;
  margin: 1rem 0;
}

.empty-content p {
  color: #999;
}

.count-sheet {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-card,
.actions-card {
  margin-bottom: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-info h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge.draft {
  background: #fff3cd;
  color: #856404;
}

.status-badge.confirmed {
  background: #d4edda;
  color: #155724;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 600;
  color: #333;
}

.supplier-name {
  font-size: 0.85rem;
  color: #666;
}

.expected-qty {
  font-weight: 500;
  color: #666;
}

.variance {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.variance-exact {
  background: #d4edda;
  color: #155724;
}

.variance-surplus {
  background: #cce5ff;
  color: #004085;
}

.variance-shortage {
  background: #f8d7da;
  color: #721c24;
}

.value {
  font-weight: 600;
  color: #1976d2;
}

.text-muted {
  color: #999;
}

.uncounted {
  border: 2px solid #ff9800 !important;
  background: #fff3e0 !important;
}

.confirm-content {
  padding: 1rem 0;
}

.summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.summary h3 {
  margin-top: 0;
}

.summary p {
  margin: 0.5rem 0;
}

.report-preview {
  padding: 1rem 0;
}

.report-summary {
  margin-bottom: 2rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.summary-item label {
  font-size: 0.9rem;
  color: #666;
}

.summary-item span {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.value-large {
  font-size: 1.5rem !important;
  color: #1976d2 !important;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}
</style>
