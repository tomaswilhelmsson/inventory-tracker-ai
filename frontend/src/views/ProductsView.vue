<template>
  <div class="products-view">
    <div class="header">
      <h1>{{ t('products.title') }}</h1>
      <div class="header-actions">
        <Button
          :label="showDisabled ? t('common.hideDisabled') : t('common.showDisabled')"
          :icon="showDisabled ? 'pi pi-eye-slash' : 'pi pi-eye'"
          text
          @click="showDisabled = !showDisabled"
        />
        <Button :label="t('products.addProduct')" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="filteredProducts"
          :loading="loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <template #header>
            <div class="table-header">
              <IconField iconPosition="left">
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="searchQuery"
                  :placeholder="t('products.searchProducts')"
                />
              </IconField>
            </div>
          </template>

          <Column field="name" :header="t('products.table.name')" sortable>
            <template #body="{ data }">
              <span 
                :class="{ 'disabled-item': !data.isActive, 'product-name-link': true }"
                @click="openHistoryDialog(data)"
                style="cursor: pointer;"
              >
                {{ data.name }}
              </span>
              <Tag v-if="!data.isActive" :value="t('common.disabled')" severity="secondary" class="ml-2" />
            </template>
          </Column>

          <Column field="unit.name" :header="t('products.table.unit')" sortable style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.unit?.name || t('units.names.pieces')" severity="secondary" />
            </template>
          </Column>

          <Column field="description" :header="t('products.table.description')" sortable>
            <template #body="{ data }">
              <span class="description-text">{{ data.description || '—' }}</span>
            </template>
          </Column>

          <Column field="suppliers" :header="t('products.table.supplier')" sortable>
            <template #body="{ data }">
              <div v-if="data.suppliers && data.suppliers.length > 0" style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                <Tag 
                  v-for="ps in data.suppliers" 
                  :key="ps.supplier.id"
                  :value="ps.supplier.name" 
                  severity="info" 
                />
              </div>
              <Tag v-else :value="t('common.noData')" severity="secondary" />
            </template>
          </Column>

          <Column field="createdAt" :header="t('products.table.created')" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column :header="t('purchases.title')" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data._count?.purchases || 0" severity="success" />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 200px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditDialog(data)"
                  v-tooltip.top="t('common.edit')"
                />
                <Button
                  :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'"
                  size="small"
                  text
                  rounded
                  :severity="data.isActive ? 'warning' : 'success'"
                  @click="confirmToggleActive(data)"
                  v-tooltip.top="data.isActive ? t('common.disable') : t('common.enable')"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="confirmDelete(data)"
                  v-tooltip.top="t('common.delete')"
                />
              </div>
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

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? t('products.editProduct') : t('products.addProduct')"
      modal
      :style="{ width: '600px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field">
          <label for="name">{{ t('products.form.name') }} *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            :placeholder="t('products.form.namePlaceholder')"
            autofocus
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field">
          <label for="description">{{ t('products.form.description') }}</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="3"
            :placeholder="t('products.form.descriptionPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="unit">{{ t('products.form.unit') }} *</label>
          <Dropdown
            id="unit"
            v-model="formData.unitId"
            :options="units"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('products.form.unitPlaceholder')"
            :class="{ 'p-invalid': formErrors.unitId }"
            :loading="loadingUnits"
          />
          <small v-if="formErrors.unitId" class="p-error">{{ formErrors.unitId }}</small>
        </div>

        <div class="field">
          <div class="field-header">
            <label for="supplier">{{ t('products.form.supplier') }} *</label>
            <Button
              :label="t('products.quickAddSupplier')"
              icon="pi pi-plus"
              size="small"
              text
              @click="showQuickAddSupplier"
            />
          </div>
          <MultiSelect
            id="supplier"
            v-model="formData.supplierIds"
            :options="suppliers"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('products.form.supplierPlaceholder')"
            :class="{ 'p-invalid': formErrors.supplierIds }"
            :loading="loadingSuppliers"
            filter
            display="chip"
          >
            <template #option="slotProps">
              <div class="supplier-option">
                <div>{{ slotProps.option.name }}</div>
                <small v-if="slotProps.option.contactInfo" class="text-secondary">
                  {{ slotProps.option.contactInfo }}
                </small>
              </div>
            </template>
          </MultiSelect>
          <small v-if="formErrors.supplierIds" class="p-error">{{ formErrors.supplierIds }}</small>
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? t('common.edit') : t('common.add')"
          :loading="saving"
          @click="saveProduct"
        />
      </template>
    </Dialog>

    <!-- Quick Add Supplier Dialog -->
    <Dialog
      v-model:visible="quickAddSupplierVisible"
      :header="t('products.quickAddSupplierTitle')"
      modal
      :style="{ width: '400px' }"
    >
      <div class="form-container">
        <div class="field">
          <label for="supplierName">{{ t('suppliers.form.name') }} *</label>
          <InputText
            id="supplierName"
            v-model="quickSupplierData.name"
            :class="{ 'p-invalid': quickSupplierErrors.name }"
            :placeholder="t('suppliers.form.namePlaceholder')"
            autofocus
          />
          <small v-if="quickSupplierErrors.name" class="p-error">{{ quickSupplierErrors.name }}</small>
        </div>

        <div class="field">
          <label for="supplierContact">{{ t('suppliers.form.phone') }}</label>
          <InputText
            id="supplierContact"
            v-model="quickSupplierData.phone"
            :placeholder="t('suppliers.form.phonePlaceholder')"
          />
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="quickAddSupplierVisible = false" />
        <Button
          :label="t('common.add')"
          :loading="savingQuickSupplier"
          @click="saveQuickSupplier"
        />
      </template>
    </Dialog>

    <!-- Purchase History Dialog -->
    <Dialog
      v-model:visible="historyDialogVisible"
      :header="t('products.history.title', { name: selectedProduct?.name || '' })"
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
              <span class="value">{{ productHistory.currentQuantity || 0 }} {{ selectedProduct?.unit?.name }}</span>
            </div>
            <div v-if="productHistory.lastYearEndCount" class="summary-item">
              <label>{{ t('products.history.actualQuantity') }}:</label>
              <span class="value">{{ productHistory.lastYearEndCount.countedQuantity || 0 }} {{ selectedProduct?.unit?.name }}</span>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import api from '@/services/api';

import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';

interface Supplier {
  id: number;
  name: string;
  contactInfo?: string;
}

interface Unit {
  id: number;
  name: string;
}

interface ProductSupplier {
  id: number;
  supplierId: number;
  preferredUnitCost?: number;
  supplier: Supplier;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  unitId: number;
  unit?: Unit;
  suppliers: ProductSupplier[];
  createdAt: string;
  _count?: {
    purchases: number;
  };
}

interface FormData {
  name: string;
  description: string;
  unitId: number | null;
  supplierIds: number[];
}

interface FormErrors {
  name?: string;
  unitId?: string;
  supplierIds?: string;
}

const toast = useToast();
const confirm = useConfirm();
const { t } = useI18n();

const products = ref<Product[]>([]);
const suppliers = ref<Supplier[]>([]);
const units = ref<Unit[]>([]);
const loading = ref(false);
const loadingSuppliers = ref(false);
const loadingUnits = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);
const currentProductId = ref<number | null>(null);

const formData = ref<FormData>({
  name: '',
  description: '',
  unitId: null,
  supplierIds: [],
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');
const showDisabled = ref(false);

// Quick Add Supplier state
const quickAddSupplierVisible = ref(false);
const savingQuickSupplier = ref(false);
const quickSupplierData = ref({
  name: '',
  phone: '',
});
const quickSupplierErrors = ref<{ name?: string }>({});

// Purchase History Dialog state
const historyDialogVisible = ref(false);
const loadingHistory = ref(false);
const selectedProduct = ref<Product | null>(null);
const productHistory = ref<any>(null);

// Computed: filtered products
const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value;
  }
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(p => 
    p.name.toLowerCase().includes(query) ||
    (p.description && p.description.toLowerCase().includes(query)) ||
    (p.suppliers && p.suppliers.some(ps => ps.supplier.name.toLowerCase().includes(query)))
  );
});

// Fetch products
const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (showDisabled.value) {
      params.append('includeInactive', 'true');
    }
    const response = await api.get(`/products?${params.toString()}`);
    products.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Fetch suppliers
const fetchSuppliers = async () => {
  loadingSuppliers.value = true;
  try {
    const response = await api.get('/suppliers');
    suppliers.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
      life: 3000,
    });
  } finally {
    loadingSuppliers.value = false;
  }
};

// Fetch units
const fetchUnits = async () => {
  loadingUnits.value = true;
  try {
    const response = await api.get('/units');
    units.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
      life: 3000,
    });
  } finally {
    loadingUnits.value = false;
  }
};

// Open create dialog
const openCreateDialog = async () => {
  if (suppliers.value.length === 0) {
    await fetchSuppliers();
  }
  
  if (units.value.length === 0) {
    await fetchUnits();
  }

  if (suppliers.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('products.messages.noSuppliers'),
      life: 5000,
    });
    return;
  }

  if (units.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('products.messages.noUnits'),
      life: 5000,
    });
    return;
  }

  editMode.value = false;
  currentProductId.value = null;
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = async (product: Product) => {
  if (suppliers.value.length === 0) {
    await fetchSuppliers();
  }
  
  if (units.value.length === 0) {
    await fetchUnits();
  }

  editMode.value = true;
  currentProductId.value = product.id;
  formData.value = {
    name: product.name,
    description: product.description || '',
    unitId: product.unitId,
    supplierIds: product.suppliers.map(ps => ps.supplierId),
  };
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};

  if (!formData.value.name.trim()) {
    formErrors.value.name = t('validation.required');
  }

  if (!formData.value.unitId) {
    formErrors.value.unitId = t('validation.required');
  }

  if (!formData.value.supplierIds || formData.value.supplierIds.length === 0) {
    formErrors.value.supplierIds = t('validation.required');
  }

  return Object.keys(formErrors.value).length === 0;
};

// Save product (create or update)
const saveProduct = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined,
      unitId: formData.value.unitId,
      supplierIds: formData.value.supplierIds,
    };

    if (editMode.value && currentProductId.value) {
      // Update existing product
      await api.put(`/products/${currentProductId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('products.messages.updateSuccess'),
        life: 3000,
      });
    } else {
      // Create new product
      await api.post('/products', payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('products.messages.createSuccess'),
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.messages.saveFailed'),
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDelete = (product: Product) => {
  const purchaseCount = product._count?.purchases || 0;

  if (purchaseCount > 0) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('products.messages.cannotDeleteWithPurchases', { count: purchaseCount }),
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: t('products.messages.deleteConfirm', { name: product.name }),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteProduct(product.id),
  });
};

// Delete product
const deleteProduct = async (id: number) => {
  try {
    await api.delete(`/products/${id}`);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('products.messages.deleteSuccess'),
      life: 3000,
    });
    await fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.messages.deleteFailed'),
      life: 3000,
    });
  }
};

// Toggle active status
const confirmToggleActive = (product: Product) => {
  const action = product.isActive ? 'disable' : 'enable';
  const messageKey = product.isActive ? 'products.messages.disableConfirm' : 'products.messages.enableConfirm';
  
  confirm.require({
    message: t(messageKey, { name: product.name }),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: product.isActive ? 'p-button-warning' : 'p-button-success',
    accept: () => toggleProductActive(product.id, action),
  });
};

const toggleProductActive = async (id: number, action: string) => {
  try {
    await api.patch(`/products/${id}/toggle-active`);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t(`products.messages.${action}Success`),
      life: 3000,
    });
    await fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.messages.toggleFailed'),
      life: 3000,
    });
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    unitId: null,
    supplierIds: [],
  };
  formErrors.value = {};
};

// Format date - import utility
import { formatDate } from '@/utils/dateFormatter';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

// Quick Add Supplier functions
const showQuickAddSupplier = () => {
  quickSupplierData.value = {
    name: '',
    phone: '',
  };
  quickSupplierErrors.value = {};
  quickAddSupplierVisible.value = true;
};

const saveQuickSupplier = async () => {
  // Validate
  quickSupplierErrors.value = {};
  if (!quickSupplierData.value.name.trim()) {
    quickSupplierErrors.value.name = t('suppliers.errors.nameRequired');
    return;
  }

  savingQuickSupplier.value = true;
  try {
    const payload: any = {
      name: quickSupplierData.value.name.trim(),
    };
    
    // Only include phone if it's not empty
    if (quickSupplierData.value.phone.trim()) {
      payload.phone = quickSupplierData.value.phone.trim();
    }
    
    const response = await api.post('/suppliers', payload);

    // Add new supplier to the list
    suppliers.value.push(response.data);

    // Auto-select the new supplier
    if (!formData.value.supplierIds.includes(response.data.id)) {
      formData.value.supplierIds.push(response.data.id);
    }

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('suppliers.messages.createSuccess'),
      life: 3000,
    });

    quickAddSupplierVisible.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('suppliers.messages.saveFailed'),
      life: 3000,
    });
  } finally {
    savingQuickSupplier.value = false;
  }
};

// Open purchase history dialog
const openHistoryDialog = async (product: Product) => {
  selectedProduct.value = product;
  historyDialogVisible.value = true;
  await fetchProductHistory(product.id);
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

// Watch showDisabled to refetch when toggled
watch(showDisabled, () => {
  fetchProducts();
});

// Load data on mount
onMounted(() => {
  fetchProducts();
  fetchSuppliers();
  fetchUnits();
});
</script>

<style scoped>
.products-view {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.description-text {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.empty-state p {
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  font-size: 0.875rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.field-header label {
  font-weight: 600;
  font-size: 0.875rem;
}

.supplier-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.text-secondary {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.p-invalid {
  border-color: var(--red-500);
}

.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.disabled-item {
  color: var(--text-color-secondary);
  text-decoration: line-through;
}

.product-name-link {
  color: var(--primary-color);
  text-decoration: underline;
  transition: color 0.2s;
}

.product-name-link:hover {
  color: var(--primary-color-text);
}

.history-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.inventory-summary {
  background: var(--surface-100);
  padding: 1.5rem;
  border-radius: 6px;
}

.inventory-summary h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.purchase-history h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-style: italic;
}
</style>
