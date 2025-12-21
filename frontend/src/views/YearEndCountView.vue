<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
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
import Dropdown from 'primevue/dropdown';

const toast = useToast();
const { t, n } = useI18n();

const loading = ref(false);
const countSheet = ref<any>(null);
const showConfirmDialog = ref(false);
const showReportDialog = ref(false);
const reportData = ref<any>(null);
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const selectedRevision = ref<number | null>(null);
const availableYears = ref<number[]>([]);
const availableRevisions = ref<any[]>([]);
const showUnlockDialog = ref(false);
const unlockReason = ref({ category: 'data_error', description: '' });
const unlockHistory = ref<any[]>([]);
const showUnlockHistoryDialog = ref(false);
const mostRecentLockedYear = ref<number | null>(null);
const isYearLocked = ref(false);

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
    const response = await api.post('/year-end-count', { year: selectedYear.value });
    await loadCountSheet(response.data.id);
    await loadAvailableRevisions();
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.messages.initiateSuccess', { year: selectedYear.value }),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.initiateFailed'),
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
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.loadSheetFailed'),
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

async function loadExistingCount() {
  loading.value = true;
  try {
    // If revision is selected, load that specific revision
    const url = selectedRevision.value 
      ? `/year-end-count/${selectedYear.value}?revision=${selectedRevision.value}`
      : `/year-end-count/${selectedYear.value}`;
    
    const response = await api.get(url);
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
        summary: t('common.error'),
        detail: error.response?.data?.error || t('yearEndCount.messages.loadFailed'),
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
      summary: t('common.saved'),
      detail: t('yearEndCount.messages.countUpdated', { productName: item.product.name }),
      life: 2000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.updateFailed'),
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
    link.setAttribute('download', `count-sheet-${selectedYear.value}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.messages.exportCSVSuccess'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('yearEndCount.messages.exportCSVFailed'),
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
    link.setAttribute('download', `count-sheet-${selectedYear.value}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.messages.exportPDFSuccess'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('yearEndCount.messages.exportPDFFailed'),
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
      summary: t('common.success'),
      detail: t('yearEndCount.messages.importSuccess', { count: response.data.results.successful }),
      life: 5000,
    });

    if (response.data.results.failed > 0) {
      toast.add({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('yearEndCount.messages.importWarning', { count: response.data.results.failed }),
        life: 5000,
      });
      console.error('Import errors:', response.data.results.errors);
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.importFailed'),
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
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.reportFailed'),
      life: 5000,
    });
  }
}

async function confirmCount() {
  if (!isCountComplete.value) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('yearEndCount.messages.incompleteCount', { count: uncountedItems.value.length }),
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
    await api.post(`/year-end-count/${countSheet.value.id}/confirm`);
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.messages.confirmSuccess'),
      life: 5000,
    });

    showConfirmDialog.value = false;
    await loadExistingCount();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.messages.confirmFailed'),
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

async function checkLockStatus() {
  try {
    const response = await api.get('/purchases/locked-years');
    const lockedYears = response.data;
    if (lockedYears.length > 0) {
      const mostRecent = lockedYears.reduce((max: any, year: any) => 
        year.year > max.year ? year : max
      );
      mostRecentLockedYear.value = mostRecent.year;
      isYearLocked.value = lockedYears.some((y: any) => y.year === selectedYear.value);
    }
  } catch (error) {
    console.error('Failed to check lock status:', error);
  }
}

async function unlockYear() {
  if (!unlockReason.value.description.trim()) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('yearEndCount.unlock.descriptionRequired'),
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    await api.post(`/year-end-count/${selectedYear.value}/unlock`, {
      reasonCategory: unlockReason.value.category,
      description: unlockReason.value.description,
    });

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('yearEndCount.unlock.success', { year: selectedYear.value }),
      life: 3000,
    });

    showUnlockDialog.value = false;
    unlockReason.value = { category: 'data_error', description: '' };
    await checkLockStatus();
    await loadAvailableRevisions();
    await loadExistingCount();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.unlock.failed'),
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
}

async function loadUnlockHistory() {
  try {
    const response = await api.get(`/year-end-count/${selectedYear.value}/unlock-history`);
    unlockHistory.value = response.data;
    showUnlockHistoryDialog.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('yearEndCount.unlock.historyFailed'),
      life: 5000,
    });
  }
}

async function loadAvailableYears() {
  try {
    const response = await api.get('/purchases/locked-years');
    const lockedYears = response.data.map((y: any) => y.year);
    
    // Include current year and all locked years
    const years = new Set([currentYear, ...lockedYears]);
    availableYears.value = Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Failed to load available years:', error);
    availableYears.value = [currentYear];
  }
}

async function loadAvailableRevisions() {
  try {
    const response = await api.get(`/year-end-count/${selectedYear.value}/revisions`);
    availableRevisions.value = response.data;
    
    // If there are revisions, select the most recent one
    if (availableRevisions.value.length > 0) {
      const mostRecent = availableRevisions.value.reduce((max: any, rev: any) => 
        rev.revision > max.revision ? rev : max
      );
      selectedRevision.value = mostRecent.revision;
    } else {
      selectedRevision.value = null;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      availableRevisions.value = [];
      selectedRevision.value = null;
    } else {
      console.error('Failed to load revisions:', error);
    }
  }
}

async function onYearChange() {
  await loadAvailableRevisions();
  await loadExistingCount();
  await checkLockStatus();
}

async function onRevisionChange() {
  await loadExistingCount();
}

onMounted(async () => {
  await loadAvailableYears();
  await loadAvailableRevisions();
  await loadExistingCount();
  await checkLockStatus();
});
</script>

<template>
  <div class="year-end-count">
    <div class="header">
      <div class="header-left">
        <h1>{{ t('yearEndCount.title', { year: selectedYear }) }}</h1>
        <div class="year-selector">
          <label>{{ t('yearEndCount.selectYear') }}:</label>
          <Dropdown
            v-model="selectedYear"
            :options="availableYears"
            @change="onYearChange"
            :placeholder="t('yearEndCount.selectYear')"
            class="year-dropdown"
          />
          <div v-if="availableRevisions.length > 0" class="revision-selector">
            <label>{{ t('yearEndCount.selectRevision') }}:</label>
            <Dropdown
              v-model="selectedRevision"
              :options="availableRevisions"
              optionLabel="revision"
              optionValue="revision"
              @change="onRevisionChange"
              :placeholder="t('yearEndCount.selectRevision')"
              class="revision-dropdown"
            >
              <template #option="slotProps">
                <div class="revision-option">
                  <span>{{ t('yearEndCount.revision') }} {{ slotProps.option.revision }}</span>
                  <span class="revision-status">{{ slotProps.option.status }}</span>
                </div>
              </template>
              <template #value="slotProps">
                <span v-if="slotProps.value">{{ t('yearEndCount.revision') }} {{ slotProps.value }}</span>
              </template>
            </Dropdown>
          </div>
        </div>
      </div>
      <div class="actions" v-if="!countSheet && selectedYear === currentYear">
        <Button
          :label="t('yearEndCount.initiateCount')"
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
            <h2>{{ t('yearEndCount.noCountInProgress') }}</h2>
            <p v-if="selectedYear === currentYear">{{ t('yearEndCount.clickToInitiate', { year: selectedYear }) }}</p>
            <p v-else>{{ t('yearEndCount.noCountForYear', { year: selectedYear }) }}</p>
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
              <h3>{{ t('yearEndCount.progress', { counted: countedItems, total: totalItems }) }}</h3>
              <span class="percentage">{{ progress }}%</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" />
            <div v-if="uncountedItems.length > 0" class="uncounted-warning">
              <Message severity="warn" :closable="false">
                {{ t('yearEndCount.productsNeedCounting', { count: uncountedItems.length }) }}
              </Message>
            </div>
            <div v-else>
              <Message severity="success" :closable="false">
                {{ t('yearEndCount.allProductsCounted') }}
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
              v-if="countSheet.status === 'confirmed' && isYearLocked && selectedYear === mostRecentLockedYear"
              :label="t('yearEndCount.unlock.unlockYear')"
              icon="pi pi-unlock"
              @click="showUnlockDialog = true"
              severity="warning"
            />
            <Button
              v-if="unlockHistory.length > 0 || countSheet.status === 'confirmed'"
              :label="t('yearEndCount.unlock.viewHistory')"
              icon="pi pi-history"
              @click="loadUnlockHistory"
              outlined
            />
            <Button
              :label="t('yearEndCount.exportCSV')"
              icon="pi pi-file"
              @click="exportCSV"
              outlined
            />
            <Button
              :label="t('yearEndCount.exportPDF')"
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
              :chooseLabel="t('yearEndCount.importCSV')"
              customUpload
            />
            <Button
              :label="t('yearEndCount.previewReport')"
              icon="pi pi-eye"
              @click="previewReport"
              severity="info"
            />
            <Button
              :label="t('yearEndCount.confirmCount')"
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
            <div>
              <span>{{ t('yearEndCount.countSheet') }}</span>
              <span v-if="countSheet.revision && countSheet.revision > 1" class="revision-badge">
                Revision {{ countSheet.revision }}
              </span>
            </div>
            <span v-if="countSheet.status === 'confirmed'" class="status-badge confirmed">
              <i class="pi pi-lock"></i> {{ t('yearEndCount.confirmedLocked') }}
            </span>
            <span v-else class="status-badge draft">
              <i class="pi pi-pencil"></i> {{ t('yearEndCount.draft') }}
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
            <Column field="product.name" :header="t('yearEndCount.table.productName')" sortable>
              <template #body="{ data }">
                <div class="product-cell">
                  <span class="product-name">{{ data.product.name }}</span>
                  <span class="supplier-name">{{ data.product.supplier.name }}</span>
                </div>
              </template>
            </Column>

            <Column field="expectedQuantity" :header="t('yearEndCount.table.expectedQuantity')" sortable>
              <template #body="{ data }">
                <span class="expected-qty">{{ n(data.expectedQuantity, 'integer') }} {{ data.product?.unit?.name || t('units.names.pieces') }}</span>
              </template>
            </Column>

            <Column field="countedQuantity" :header="t('yearEndCount.table.actualCount')">
              <template #body="{ data }">
                <InputNumber
                  v-model="data.countedQuantity"
                  @blur="updateCountItem(data)"
                  :min="0"
                  :disabled="countSheet.status === 'confirmed'"
                  :class="{ 'uncounted': data.countedQuantity === null }"
                  :placeholder="t('yearEndCount.table.enterCount')"
                />
              </template>
            </Column>

            <Column field="variance" :header="t('yearEndCount.table.variance')" sortable>
              <template #body="{ data }">
                <div v-if="data.variance !== null" :class="['variance', getVarianceClass(data.variance)]">
                  <i :class="['pi', getVarianceIcon(data.variance)]"></i>
                  <span>{{ data.variance >= 0 ? '+' : '' }}{{ n(data.variance, 'integer') }} {{ data.product?.unit?.name || t('units.names.pieces') }}</span>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </Column>

            <Column field="value" :header="t('yearEndCount.table.valueFIFO')" sortable>
              <template #body="{ data }">
                <span v-if="data.value !== null" class="value">
                  {{ n(data.value, 'currency') }}
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
      :header="t('yearEndCount.confirmDialog.header')"
      :modal="true"
      :closable="!loading"
    >
      <div class="confirm-content">
        <Message severity="warn" :closable="false">
          <strong>{{ t('common.warning') }}:</strong> {{ t('yearEndCount.confirmDialog.warningText') }}
          <ul>
            <li>{{ t('yearEndCount.confirmDialog.updateFIFO') }}</li>
            <li>{{ t('yearEndCount.confirmDialog.lockYear', { year: selectedYear }) }}</li>
            <li>{{ t('yearEndCount.confirmDialog.createBackup') }}</li>
          </ul>
          {{ t('yearEndCount.confirmDialog.cannotUndo') }}
        </Message>

        <div v-if="reportData" class="summary">
          <h3>{{ t('yearEndCount.confirmDialog.summary') }}:</h3>
          <p><strong>{{ t('yearEndCount.confirmDialog.totalExpected') }}:</strong> {{ n(reportData.totalExpected, 'integer') }}</p>
          <p><strong>{{ t('yearEndCount.confirmDialog.totalCounted') }}:</strong> {{ n(reportData.totalCounted, 'integer') }}</p>
          <p><strong>{{ t('yearEndCount.confirmDialog.totalVariance') }}:</strong> {{ reportData.totalVariance }}</p>
          <p><strong>{{ t('yearEndCount.confirmDialog.totalValue') }}:</strong> {{ n(reportData.totalValue, 'currency') }}</p>
        </div>
      </div>

      <template #footer>
        <Button
          :label="t('common.cancel')"
          icon="pi pi-times"
          @click="showConfirmDialog = false"
          text
          :disabled="loading"
        />
        <Button
          :label="t('yearEndCount.confirmLockYear')"
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
      :header="t('yearEndCount.reportDialog.header')"
      :modal="true"
      :style="{ width: '80vw' }"
    >
      <div v-if="reportData" class="report-preview">
        <div class="report-summary">
          <h3>{{ t('yearEndCount.reportDialog.yearStatus', { year: reportData.year, status: reportData.status.toUpperCase() }) }}</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <label>{{ t('yearEndCount.reportDialog.totalExpected') }}:</label>
              <span>{{ n(reportData.totalExpected, 'integer') }}</span>
            </div>
            <div class="summary-item">
              <label>{{ t('yearEndCount.reportDialog.totalCounted') }}:</label>
              <span>{{ n(reportData.totalCounted, 'integer') }}</span>
            </div>
            <div class="summary-item">
              <label>{{ t('yearEndCount.reportDialog.totalVariance') }}:</label>
              <span :class="reportData.totalVariance >= 0 ? 'text-success' : 'text-danger'">
                {{ reportData.totalVariance >= 0 ? '+' : '' }}{{ n(reportData.totalVariance, 'integer') }}
              </span>
            </div>
            <div class="summary-item">
              <label>{{ t('yearEndCount.reportDialog.totalValue') }}:</label>
              <span class="value-large">{{ n(reportData.totalValue, 'currency') }}</span>
            </div>
          </div>
        </div>

        <DataTable :value="reportData.items" :paginator="true" :rows="10">
          <Column field="productName" :header="t('yearEndCount.reportDialog.product')" sortable />
          <Column field="expectedQuantity" :header="t('yearEndCount.reportDialog.expected')" sortable />
          <Column field="countedQuantity" :header="t('yearEndCount.reportDialog.counted')" sortable />
          <Column field="variance" :header="t('yearEndCount.reportDialog.variance')" sortable>
            <template #body="{ data }">
              <span :class="data.variance >= 0 ? 'text-success' : 'text-danger'">
                {{ data.variance >= 0 ? '+' : '' }}{{ n(data.variance, 'integer') }}
              </span>
            </template>
          </Column>
          <Column field="value" :header="t('yearEndCount.reportDialog.value')" sortable>
            <template #body="{ data }">
              {{ n(data.value, 'currency') }}
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <!-- Unlock Year Dialog -->
    <Dialog
      v-model:visible="showUnlockDialog"
      :header="t('yearEndCount.unlock.dialogHeader')"
      :modal="true"
      :closable="!loading"
      :style="{ width: '500px' }"
    >
      <div class="unlock-content">
        <Message severity="warn" :closable="false">
          <strong>{{ t('common.warning') }}:</strong> {{ t('yearEndCount.unlock.warningText', { year: selectedYear }) }}
        </Message>

        <div class="form-field">
          <label>{{ t('yearEndCount.unlock.reasonCategory') }}:</label>
          <select v-model="unlockReason.category" class="p-inputtext">
            <option value="data_error">{{ t('yearEndCount.unlock.categories.dataError') }}</option>
            <option value="recount_required">{{ t('yearEndCount.unlock.categories.recountRequired') }}</option>
            <option value="audit_adjustment">{{ t('yearEndCount.unlock.categories.auditAdjustment') }}</option>
            <option value="other">{{ t('yearEndCount.unlock.categories.other') }}</option>
          </select>
        </div>

        <div class="form-field">
          <label>{{ t('yearEndCount.unlock.description') }}:</label>
          <textarea
            v-model="unlockReason.description"
            rows="4"
            class="p-inputtext"
            :placeholder="t('yearEndCount.unlock.descriptionPlaceholder')"
          />
        </div>
      </div>

      <template #footer>
        <Button
          :label="t('common.cancel')"
          icon="pi pi-times"
          @click="showUnlockDialog = false"
          text
          :disabled="loading"
        />
        <Button
          :label="t('yearEndCount.unlock.confirmUnlock')"
          icon="pi pi-unlock"
          @click="unlockYear"
          severity="warning"
          :loading="loading"
        />
      </template>
    </Dialog>

    <!-- Unlock History Dialog -->
    <Dialog
      v-model:visible="showUnlockHistoryDialog"
      :header="t('yearEndCount.unlock.historyHeader', { year: selectedYear })"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div v-if="unlockHistory.length === 0" class="no-history">
        <p>{{ t('yearEndCount.unlock.noHistory') }}</p>
      </div>
      <div v-else>
        <DataTable :value="unlockHistory">
          <Column field="unlockedAt" :header="t('yearEndCount.unlock.table.date')">
            <template #body="{ data }">
              {{ new Date(data.unlockedAt).toLocaleString() }}
            </template>
          </Column>
          <Column field="reasonCategory" :header="t('yearEndCount.unlock.table.category')">
            <template #body="{ data }">
              {{ t(`yearEndCount.unlock.categories.${data.reasonCategory}`) }}
            </template>
          </Column>
          <Column field="description" :header="t('yearEndCount.unlock.table.description')" />
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
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-left {
  flex: 1;
}

.header h1 {
  margin: 0 0 1rem 0;
  color: #333;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.year-selector label {
  font-weight: 600;
  color: #666;
}

.year-dropdown {
  min-width: 120px;
}

.revision-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.revision-dropdown {
  min-width: 150px;
}

.revision-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.revision-status {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background: #e3f2fd;
  color: #1976d2;
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

.unlock-content {
  padding: 1rem 0;
}

.form-field {
  margin: 1rem 0;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-field select,
.form-field textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: inherit;
}

.form-field textarea {
  resize: vertical;
}

.no-history {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.revision-badge {
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
