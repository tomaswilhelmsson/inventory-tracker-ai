<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import Card from 'primevue/card';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

const toast = useToast();
const { t } = useI18n();

const exportLoading = ref(false);
const importLoading = ref(false);
const lastExportTime = ref<string | null>(localStorage.getItem('lastExportTime'));
const selectedFile = ref<File | null>(null);
const showConfirmDialog = ref(false);
const confirmChecked = ref(false);
const importResult = ref<any>(null);

async function exportDatabase() {
  exportLoading.value = true;
  try {
    const response = await api.post('/backup/export', {}, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'inventory-backup.json';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match) {
        filename = match[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Save export timestamp
    const now = new Date().toISOString();
    localStorage.setItem('lastExportTime', now);
    lastExportTime.value = now;

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('backup.messages.exportSuccess'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('backup.messages.exportError'),
      life: 5000,
    });
  } finally {
    exportLoading.value = false;
  }
}

function onFileSelect(event: any) {
  const file = event.files[0];
  
  if (!file) {
    return;
  }

  // Validate file type
  if (!file.name.endsWith('.json')) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('backup.messages.invalidFile'),
      life: 3000,
    });
    selectedFile.value = null;
    return;
  }

  // Validate file size (100MB max)
  if (file.size > 100 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('backup.messages.fileTooLarge'),
      life: 3000,
    });
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
}

function showImportConfirmation() {
  if (!selectedFile.value) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('backup.messages.noFileSelected'),
      life: 3000,
    });
    return;
  }

  showConfirmDialog.value = true;
  confirmChecked.value = false;
}

async function confirmImport() {
  if (!confirmChecked.value) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('backup.messages.confirmRequired'),
      life: 3000,
    });
    return;
  }

  if (!selectedFile.value) {
    return;
  }

  importLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('confirm', 'true');

    const response = await api.post('/backup/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    importResult.value = response.data;
    showConfirmDialog.value = false;
    selectedFile.value = null;

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('backup.messages.importSuccess'),
      life: 5000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('backup.messages.importError'),
      life: 5000,
    });
  } finally {
    importLoading.value = false;
  }
}

function cancelImport() {
  showConfirmDialog.value = false;
  confirmChecked.value = false;
}

function formatDateWithTime(isoString: string | null): string {
  if (!isoString) return t('backup.exportSection.never');
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

</script>

<template>
  <div class="backup-restore">
    <h1>{{ t('backup.title') }}</h1>

    <!-- Export Section -->
    <Card class="export-card">
      <template #title>
        <div class="section-header">
          <i class="pi pi-download"></i>
          {{ t('backup.exportSection.title') }}
        </div>
      </template>
      <template #content>
        <p class="section-description">{{ t('backup.exportSection.description') }}</p>
        <p class="section-hint">💡 {{ t('backup.exportSection.hint') }}</p>
        
        <div class="export-actions">
          <Button
            :label="exportLoading ? t('backup.exportSection.downloading') : t('backup.exportSection.downloadButton')"
            icon="pi pi-download"
            @click="exportDatabase"
            :loading="exportLoading"
            severity="success"
          />
        </div>

        <div v-if="lastExportTime" class="last-export">
          {{ t('backup.exportSection.lastExport') }} {{ formatDateWithTime(lastExportTime) }}
        </div>
      </template>
    </Card>

    <!-- Import Section -->
    <Card class="import-card">
      <template #title>
        <div class="section-header">
          <i class="pi pi-upload"></i>
          {{ t('backup.importSection.title') }}
        </div>
      </template>
      <template #content>
        <Message severity="warn" :closable="false">
          {{ t('backup.importSection.description') }}
        </Message>
        <p class="section-hint">💡 {{ t('backup.importSection.hint') }}</p>

        <div class="import-actions">
          <FileUpload
            mode="basic"
            accept=".json"
            :maxFileSize="100000000"
            @select="onFileSelect"
            :chooseLabel="t('backup.importSection.chooseFile')"
            :auto="false"
          />

          <Button
            v-if="selectedFile"
            :label="importLoading ? t('backup.importSection.importing') : t('backup.importSection.importButton')"
            icon="pi pi-upload"
            @click="showImportConfirmation"
            :loading="importLoading"
            severity="danger"
          />
        </div>

        <div v-if="selectedFile" class="file-selected">
          {{ t('backup.importSection.fileSelected') }} {{ selectedFile.name }}
        </div>

        <!-- Import Result Summary -->
        <div v-if="importResult" class="import-summary">
          <h3>{{ t('backup.summary.title') }}</h3>
          <ul>
            <li>{{ t('backup.summary.unitsImported') }} {{ importResult.recordsImported.units }}</li>
            <li>{{ t('backup.summary.suppliersImported') }} {{ importResult.recordsImported.suppliers }}</li>
            <li>{{ t('backup.summary.productsImported') }} {{ importResult.recordsImported.products }}</li>
            <li>{{ t('backup.summary.purchaseLotsImported') }} {{ importResult.recordsImported.purchaseLots }}</li>
            <li>{{ t('backup.summary.yearEndCountsImported') }} {{ importResult.recordsImported.yearEndCounts }}</li>
          </ul>
        </div>
      </template>
    </Card>

    <!-- Confirmation Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      :header="t('backup.confirmDialog.title')"
      :modal="true"
      :closable="!importLoading"
      :style="{ width: '500px' }"
    >
      <div class="confirm-content">
        <Message severity="warn" :closable="false">
          {{ t('backup.confirmDialog.warning') }}
        </Message>

        <div v-if="selectedFile" class="backup-info">
          <p><strong>{{ t('backup.confirmDialog.backupFile') }}</strong> {{ selectedFile.name }}</p>
        </div>

        <div class="confirm-checkbox">
          <Checkbox v-model="confirmChecked" inputId="confirmCheck" binary />
          <label for="confirmCheck">{{ t('backup.confirmDialog.checkbox') }}</label>
        </div>
      </div>

      <template #footer>
        <Button
          :label="t('backup.confirmDialog.cancelButton')"
          icon="pi pi-times"
          @click="cancelImport"
          text
          :disabled="importLoading"
        />
        <Button
          :label="t('backup.confirmDialog.confirmButton')"
          icon="pi pi-check"
          @click="confirmImport"
          severity="danger"
          :loading="importLoading"
          :disabled="!confirmChecked"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.backup-restore {
  max-width: 900px;
  margin: 0 auto;
}

.backup-restore h1 {
  margin-bottom: 2rem;
  color: #333;
}

.export-card,
.import-card {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  margin-bottom: 1rem;
  color: #666;
}

.section-hint {
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #f5f9ff;
  border-left: 3px solid #2196f3;
  color: #555;
  font-size: 0.9rem;
}

.export-actions,
.import-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.last-export {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.file-selected {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #333;
}

.import-summary {
  margin-top: 2rem;
  padding: 1rem;
  background: #e8f5e9;
  border-left: 3px solid #4caf50;
  border-radius: 4px;
}

.import-summary h3 {
  margin: 0 0 1rem 0;
  color: #2e7d32;
}

.import-summary ul {
  margin: 0;
  padding-left: 1.5rem;
}

.import-summary li {
  margin-bottom: 0.5rem;
  color: #333;
}

.confirm-content {
  padding: 1rem 0;
}

.backup-info {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.backup-info p {
  margin: 0.5rem 0;
}

.confirm-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff3e0;
  border-radius: 4px;
}

.confirm-checkbox label {
  font-weight: 600;
  color: #e65100;
}
</style>
