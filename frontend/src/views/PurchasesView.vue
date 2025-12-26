<template>
  <div class="purchases-view">
    <div class="header">
      <h1>{{ t('purchases.title') }}</h1>
      <div class="header-actions">
        <Button :label="t('purchases.addPurchase')" icon="pi pi-plus" @click="openCreateDialog" />
        <Button 
          :label="t('purchases.multiItem.title')" 
          icon="pi pi-table" 
          @click="multiItemDialogVisible = true"
          severity="secondary"
        />
      </div>
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="filteredPurchases"
          :loading="loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <template #header>
            <div class="table-header">
              <div class="filters">
                <Dropdown
                  v-model="selectedYearFilter"
                  :options="availableYears"
                  :placeholder="t('purchases.selectYear')"
                  class="year-filter"
                  showClear
                >
                  <template #value="slotProps">
                    <span v-if="slotProps.value">{{ slotProps.value }}</span>
                    <span v-else>{{ t('purchases.allYears') }}</span>
                  </template>
                </Dropdown>
                <IconField iconPosition="left">
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="searchQuery"
                    :placeholder="t('purchases.searchPurchases')"
                  />
                </IconField>
              </div>
            </div>
          </template>

          <Column field="purchaseDate" :header="t('purchases.table.purchaseDate')" sortable :sortOrder="-1">
            <template #body="{ data }">
              <div class="date-cell">
                {{ d(new Date(data.purchaseDate), 'short') }}
                <Tag
                  v-if="isYearLocked(data.year)"
                  :value="t('purchases.locked')"
                  severity="warning"
                  size="small"
                  v-tooltip.top="t('purchases.yearLockedCannotEdit')"
                />
              </div>
            </template>
          </Column>

          <Column field="product.name" :header="t('purchases.table.product')" sortable>
            <template #body="{ data }">
              <Tag :value="data.productSnapshot?.name || data.product?.name || t('common.unknown')" severity="info" />
            </template>
          </Column>

          <Column field="supplier.name" :header="t('purchases.table.supplier')" sortable>
            <template #body="{ data }">
              <span>{{ data.supplierSnapshot?.name || data.supplier?.name || t('common.unknown') }}</span>
            </template>
          </Column>

          <Column field="verificationNumber" :header="t('purchases.table.verificationNumber')" sortable style="width: 140px">
            <template #body="{ data }">
              <span class="verification-number">{{ data.verificationNumber || '-' }}</span>
            </template>
          </Column>

          <Column field="batchId" header="Batch" sortable style="width: 100px">
            <template #body="{ data }">
              <Tag 
                v-if="data.batchId" 
                :value="`#${data.batchId}`" 
                severity="info"
                style="cursor: pointer"
                @click="filterByBatch(data.batchId)"
                v-tooltip.top="'View all items from this invoice'"
              />
              <span v-else class="text-secondary">-</span>
            </template>
          </Column>

          <Column field="quantity" :header="t('purchases.table.quantity')" sortable style="width: 150px">
            <template #body="{ data }">
              <span class="quantity-badge">{{ n(data.quantity, 'integer') }} {{ data.productSnapshot?.unit?.name || data.product?.unit?.name || t('units.names.pieces') }}</span>
            </template>
          </Column>

          <Column field="remainingQuantity" :header="t('purchases.table.remaining')" sortable style="width: 150px">
            <template #body="{ data }">
              <Tag
                :value="`${n(data.remainingQuantity, 'integer')} ${data.productSnapshot?.unit?.name || data.product?.unit?.name || t('units.names.pieces')}`"
                :severity="data.remainingQuantity > 0 ? 'success' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="unitCost" :header="t('purchases.table.unitCost')" sortable style="width: 120px">
            <template #body="{ data }">
              {{ n(data.unitCost, 'currency') }}
            </template>
          </Column>

          <Column :header="t('purchases.table.totalCost')" style="width: 140px">
            <template #body="{ data }">
              <strong>{{ n(data.quantity * data.unitCost, 'currency') }}</strong>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditDialog(data)"
                  :disabled="isYearLocked(data.year)"
                  v-tooltip.top="isYearLocked(data.year) ? t('purchases.yearLocked') : t('common.edit')"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="confirmDelete(data)"
                  :disabled="isYearLocked(data.year)"
                  v-tooltip.top="isYearLocked(data.year) ? t('purchases.yearLocked') : t('common.delete')"
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
      :header="editMode ? t('purchases.editPurchase') : t('purchases.addPurchase')"
      modal
      :style="{ width: '700px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field-row">
          <div class="field">
            <label for="product">{{ t('purchases.form.product') }} *</label>
            <div class="dropdown-with-add">
              <Dropdown
                id="product"
                v-model="formData.productId"
                :options="products"
                optionLabel="name"
                optionValue="id"
                :placeholder="t('purchases.form.productPlaceholder')"
                :class="{ 'p-invalid': formErrors.productId }"
                :loading="loadingProducts"
                filter
                @change="onProductChange"
                style="flex: 1"
              >
                <template #option="slotProps">
                  <div class="product-option">
                    <div>{{ slotProps.option.name }}</div>
                    <small class="text-secondary">
                      {{ t('purchases.form.supplier') }}: {{ slotProps.option.supplier?.name || t('common.unknown') }}
                    </small>
                  </div>
                </template>
              </Dropdown>
              <Button
                icon="pi pi-plus"
                size="small"
                outlined
                @click="showQuickProductDialog"
                v-tooltip.top="t('products.addProduct')"
              />
            </div>
            <small v-if="formErrors.productId" class="p-error">{{ formErrors.productId }}</small>
          </div>

          <div class="field">
            <label for="supplier">{{ t('purchases.form.supplier') }} *</label>
            <div class="dropdown-with-add">
              <Dropdown
                id="supplier"
                v-model="formData.supplierId"
                :options="suppliers"
                optionLabel="name"
                optionValue="id"
                :placeholder="t('purchases.form.supplierPlaceholder')"
                :class="{ 'p-invalid': formErrors.supplierId }"
                :loading="loadingSuppliers"
                :disabled="!!formData.productId"
                filter
                style="flex: 1"
              />
              <Button
                icon="pi pi-plus"
                size="small"
                outlined
                @click="showQuickSupplierDialog"
                v-tooltip.top="t('suppliers.addSupplier')"
                :disabled="!!formData.productId"
              />
            </div>
            <small v-if="formErrors.supplierId" class="p-error">{{ formErrors.supplierId }}</small>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="purchaseDate">{{ t('purchases.form.purchaseDate') }} *</label>
            <DatePicker
              id="purchaseDate"
              v-model="formData.purchaseDate"
              :class="{ 'p-invalid': formErrors.purchaseDate }"
              dateFormat="yy-mm-dd"
              showIcon
              @date-select="onDateChange"
            />
            <small v-if="formErrors.purchaseDate" class="p-error">{{ formErrors.purchaseDate }}</small>
            <Message v-if="yearLockWarning" severity="warn" :closable="false" class="year-warning">
              <i class="pi pi-exclamation-triangle"></i>
              {{ t('purchases.messages.yearLockedWarning', { year: selectedYear }) }}
            </Message>
          </div>

          <div class="field">
            <label for="verificationNumber">{{ t('purchases.form.verificationNumber') }}</label>
            <InputText
              id="verificationNumber"
              v-model="formData.verificationNumber"
              :placeholder="t('purchases.form.verificationNumberPlaceholder')"
              maxlength="50"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="quantity">{{ t('purchases.form.quantity') }} *</label>
            <InputNumber
              id="quantity"
              v-model="formData.quantity"
              :class="{ 'p-invalid': formErrors.quantity }"
              :min="1"
              :useGrouping="true"
              :placeholder="t('purchases.form.quantityPlaceholder')"
            />
            <small v-if="formErrors.quantity" class="p-error">{{ formErrors.quantity }}</small>
          </div>

          <div class="field">
            <label for="unitCost">{{ t('purchases.form.unitCost') }} *</label>
            <InputNumber
              id="unitCost"
              v-model="formData.unitCost"
              :class="{ 'p-invalid': formErrors.unitCost }"
              mode="currency"
              currency="USD"
              :minFractionDigits="2"
              :min="0"
              :placeholder="t('purchases.form.unitCostPlaceholder')"
            />
            <small v-if="formErrors.unitCost" class="p-error">{{ formErrors.unitCost }}</small>
          </div>

          <div class="field">
            <label for="vatRate">{{ t('purchases.form.vatRate') }}</label>
            <InputNumber
              id="vatRate"
              v-model="formData.vatRate"
              suffix="%"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              :min="0"
              :max="100"
              :placeholder="t('purchases.form.vatRatePlaceholder')"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field field-checkbox">
            <label for="pricesIncludeVAT">
              <input
                type="checkbox"
                id="pricesIncludeVAT"
                v-model="formData.pricesIncludeVAT"
              />
              {{ t('purchases.form.pricesIncludeVAT') }}
            </label>
            <small class="field-hint">{{ t('purchases.form.pricesIncludeVATHint') }}</small>
          </div>
        </div>

        <div v-if="formData.quantity && formData.unitCost" class="total-display">
          <strong>{{ t('purchases.form.totalCost') }}:</strong>
          <span class="total-amount">{{ n(formData.quantity * formData.unitCost, 'currency') }}</span>
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? t('common.update') : t('common.create')"
          :loading="saving"
          :disabled="yearLockWarning"
          @click="savePurchase"
        />
      </template>
    </Dialog>

    <!-- Multi-Item Purchase Dialog -->
    <MultiItemPurchaseDialog
      v-model:visible="multiItemDialogVisible"
      @batch-created="onBatchCreated"
    />

    <!-- Quick Add Product Dialog -->
    <Dialog
      v-model:visible="quickProductDialogVisible"
      :header="t('products.addProduct')"
      modal
      :style="{ width: '500px' }"
    >
      <div class="form-container">
        <div class="field">
          <label for="quickProductName">{{ t('products.form.name') }} *</label>
          <InputText
            id="quickProductName"
            v-model="quickProductForm.name"
            :placeholder="t('products.form.namePlaceholder')"
            autofocus
          />
        </div>

        <div class="field">
          <label for="quickProductSupplier">{{ t('products.form.supplier') }} *</label>
          <Dropdown
            id="quickProductSupplier"
            v-model="quickProductForm.supplierId"
            :options="suppliers"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('products.form.supplierPlaceholder')"
            filter
          />
        </div>

        <div class="field">
          <label for="quickProductUnit">{{ t('products.form.unit') }} *</label>
          <Dropdown
            id="quickProductUnit"
            v-model="quickProductForm.unitId"
            :options="units"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('products.form.unitPlaceholder')"
            filter
          />
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="quickProductDialogVisible = false" />
        <Button
          :label="t('common.create')"
          :loading="savingQuickAdd"
          @click="saveQuickProduct"
        />
      </template>
    </Dialog>

    <!-- Quick Add Supplier Dialog -->
    <Dialog
      v-model:visible="quickSupplierDialogVisible"
      :header="t('suppliers.addSupplier')"
      modal
      :style="{ width: '500px' }"
    >
      <div class="form-container">
        <div class="field">
          <label for="quickSupplierName">{{ t('suppliers.form.name') }} *</label>
          <InputText
            id="quickSupplierName"
            v-model="quickSupplierForm.name"
            :placeholder="t('suppliers.form.namePlaceholder')"
            autofocus
          />
        </div>

        <div class="field">
          <label for="quickSupplierContact">{{ t('suppliers.form.contactPerson') }}</label>
          <InputText
            id="quickSupplierContact"
            v-model="quickSupplierForm.contactPerson"
            :placeholder="t('suppliers.form.contactPersonPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="quickSupplierEmail">{{ t('suppliers.form.email') }}</label>
          <InputText
            id="quickSupplierEmail"
            v-model="quickSupplierForm.email"
            type="email"
            :placeholder="t('suppliers.form.emailPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="quickSupplierPhone">{{ t('suppliers.form.phone') }}</label>
          <InputText
            id="quickSupplierPhone"
            v-model="quickSupplierForm.phone"
            :placeholder="t('suppliers.form.phonePlaceholder')"
          />
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="quickSupplierDialogVisible = false" />
        <Button
          :label="t('common.create')"
          :loading="savingQuickAdd"
          @click="saveQuickSupplier"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';

import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import MultiItemPurchaseDialog from '@/components/MultiItemPurchaseDialog.vue';

interface Supplier {
  id: number;
  name: string;
  contactInfo?: string;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  supplierId: number;
  supplier?: Supplier;
}

interface ProductSnapshot {
  id: number;
  name: string;
  description: string;
  unit: {
    id: number;
    name: string;
  };
  supplierIdRef: number;
}

interface SupplierSnapshot {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
}

interface Purchase {
  id: number;
  productId: number;
  supplierId: number;
  purchaseDate: string;
  quantity: number;
  unitCost: number;
  remainingQuantity: number;
  year: number;
  verificationNumber?: string;
  batchId?: number | null;
  batch?: {
    id: number;
    verificationNumber: string;
    invoiceTotal: number;
    shippingCost: number;
  };
  product?: Product;
  supplier?: Supplier;
  productSnapshot?: ProductSnapshot;
  supplierSnapshot?: SupplierSnapshot;
}

interface FormData {
  productId: number | null;
  supplierId: number | null;
  purchaseDate: Date | null;
  quantity: number | null;
  unitCost: number | null;
  verificationNumber: string;
  vatRate: number;
  pricesIncludeVAT: boolean;
}

interface FormErrors {
  productId?: string;
  supplierId?: string;
  purchaseDate?: string;
  quantity?: string;
  unitCost?: string;
}

const toast = useToast();
const confirm = useConfirm();
const { t, n, d } = useI18n();

const purchases = ref<Purchase[]>([]);
const products = ref<Product[]>([]);
const suppliers = ref<Supplier[]>([]);
const lockedYears = ref<number[]>([]);

const loading = ref(false);
const loadingProducts = ref(false);
const loadingSuppliers = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const multiItemDialogVisible = ref(false);
const editMode = ref(false);
const currentPurchaseId = ref<number | null>(null);

// Quick add dialogs
const quickProductDialogVisible = ref(false);
const quickSupplierDialogVisible = ref(false);
const quickProductForm = ref({ name: '', supplierId: null as number | null, unitId: null as number | null });
const quickSupplierForm = ref({ name: '', contactPerson: '', email: '', phone: '' });
const savingQuickAdd = ref(false);
const units = ref<any[]>([]);

const formData = ref<FormData>({
  productId: null,
  supplierId: null,
  purchaseDate: null,
  quantity: null,
  unitCost: null,
  verificationNumber: '',
  vatRate: 25,
  pricesIncludeVAT: true,
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');
const selectedYearFilter = ref<number | null>(new Date().getFullYear());

// Computed: available years from purchases
const availableYears = computed(() => {
  const years = new Set<number>();
  purchases.value.forEach(p => {
    if (p.year) {
      years.add(p.year);
    }
  });
  return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
});

// Computed: filtered purchases
const filteredPurchases = computed(() => {
  let filtered = purchases.value;
  
  // Filter by year
  if (selectedYearFilter.value !== null) {
    filtered = filtered.filter(p => p.year === selectedYearFilter.value);
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    
    // Check if searching for batch ID (format: #123)
    const batchMatch = query.match(/^#(\d+)$/);
    if (batchMatch && batchMatch[1]) {
      const batchId = parseInt(batchMatch[1], 10);
      filtered = filtered.filter(p => p.batchId === batchId);
    } else {
      // Regular search
      filtered = filtered.filter(p => 
        (p.product?.name && p.product.name.toLowerCase().includes(query)) ||
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(query)) ||
        (p.verificationNumber && p.verificationNumber.toLowerCase().includes(query))
      );
    }
  }
  
  return filtered;
});

// Computed: selected year from purchase date
const selectedYear = computed(() => {
  if (!formData.value.purchaseDate) return null;
  return formData.value.purchaseDate.getFullYear();
});

// Computed: year lock warning
const yearLockWarning = computed(() => {
  if (!selectedYear.value) return false;
  return lockedYears.value.includes(selectedYear.value);
});

// Check if year is locked
const isYearLocked = (year: number): boolean => {
  return lockedYears.value.includes(year);
};

// Fetch purchases
const fetchPurchases = async () => {
  loading.value = true;
  try {
    const response = await api.get('/purchases');
    purchases.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('purchases.messages.loadFailed'),
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Fetch products
const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const response = await api.get('/products');
    products.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.messages.loadFailed'),
      life: 3000,
    });
  } finally {
    loadingProducts.value = false;
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
      detail: error.response?.data?.error || t('suppliers.messages.loadFailed'),
      life: 3000,
    });
  } finally {
    loadingSuppliers.value = false;
  }
};

// Fetch locked years
const fetchLockedYears = async () => {
  try {
    const response = await api.get('/purchases/locked-years');
    lockedYears.value = response.data.map((item: any) => item.year);
  } catch (error: any) {
    console.error('Failed to fetch locked years:', error);
  }
};

// On product change, auto-select supplier
const onProductChange = () => {
  if (formData.value.productId) {
    const product = products.value.find(p => p.id === formData.value.productId);
    if (product) {
      formData.value.supplierId = product.supplierId;
    }
  }
};

// On date change
const onDateChange = () => {
  // Trigger reactivity for year lock warning
  formErrors.value.purchaseDate = undefined;
};

// Open create dialog
const openCreateDialog = async () => {
  if (products.value.length === 0) {
    await fetchProducts();
  }
  if (suppliers.value.length === 0) {
    await fetchSuppliers();
  }

  if (products.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('purchases.messages.noProducts'),
      life: 5000,
    });
    return;
  }

  editMode.value = false;
  currentPurchaseId.value = null;
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = async (purchase: Purchase) => {
  if (isYearLocked(purchase.year)) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('purchases.messages.cannotEditLockedYear', { year: purchase.year }),
      life: 5000,
    });
    return;
  }

  if (products.value.length === 0) {
    await fetchProducts();
  }
  if (suppliers.value.length === 0) {
    await fetchSuppliers();
  }

  editMode.value = true;
  currentPurchaseId.value = purchase.id;
  formData.value = {
    productId: purchase.productId,
    supplierId: purchase.supplierId,
    purchaseDate: new Date(purchase.purchaseDate),
    quantity: purchase.quantity,
    unitCost: purchase.unitCost,
    verificationNumber: purchase.verificationNumber || '',
    vatRate: 25, // Default for edit - can't retrieve old VAT data for now
    pricesIncludeVAT: true,
  };
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};

  if (!formData.value.productId) {
    formErrors.value.productId = t('validation.required');
  }

  if (!formData.value.supplierId) {
    formErrors.value.supplierId = t('validation.required');
  }

  if (!formData.value.purchaseDate) {
    formErrors.value.purchaseDate = t('validation.required');
  }

  if (!formData.value.quantity || formData.value.quantity <= 0) {
    formErrors.value.quantity = t('validation.quantityPositive');
  }

  if (formData.value.unitCost === null || formData.value.unitCost < 0) {
    formErrors.value.unitCost = t('validation.unitCostNonNegative');
  }

  if (yearLockWarning.value) {
    formErrors.value.purchaseDate = t('purchases.messages.cannotEditLockedYear', { year: selectedYear.value });
  }

  return Object.keys(formErrors.value).length === 0;
};

// Save purchase (create or update)
const savePurchase = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      productId: formData.value.productId,
      supplierId: formData.value.supplierId,
      purchaseDate: formData.value.purchaseDate!.toISOString().split('T')[0],
      quantity: formData.value.quantity,
      unitCost: formData.value.unitCost,
      verificationNumber: formData.value.verificationNumber || undefined,
      vatRate: formData.value.vatRate ? formData.value.vatRate / 100 : 0,
      pricesIncludeVAT: formData.value.pricesIncludeVAT,
    };

    if (editMode.value && currentPurchaseId.value) {
      // Update existing purchase
      await api.put(`/purchases/${currentPurchaseId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('purchases.messages.updateSuccess'),
        life: 3000,
      });
    } else {
      // Create new purchase
      await api.post('/purchases', payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('purchases.messages.createSuccess'),
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchPurchases();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('purchases.messages.saveFailed'),
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDelete = (purchase: Purchase) => {
  if (isYearLocked(purchase.year)) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('purchases.messages.cannotDeleteLockedYear', { year: purchase.year }),
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: t('purchases.messages.deleteConfirm'),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deletePurchase(purchase.id),
  });
};

// Delete purchase
const deletePurchase = async (id: number) => {
  try {
    await api.delete(`/purchases/${id}`);
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('purchases.messages.deleteSuccess'),
      life: 3000,
    });
    await fetchPurchases();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('purchases.messages.deleteFailed'),
      life: 3000,
    });
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    productId: null,
    supplierId: null,
    purchaseDate: null,
    quantity: null,
    unitCost: null,
    verificationNumber: '',
    vatRate: 25,
    pricesIncludeVAT: true,
  };
  formErrors.value = {};
};

// Handle batch created event
const onBatchCreated = async () => {
  await fetchPurchases();
  multiItemDialogVisible.value = false;
  toast.add({
    severity: 'success',
    summary: t('common.success'),
    detail: t('purchases.multiItem.createSuccess'),
    life: 3000,
  });
};

// Filter purchases by batch ID
const filterByBatch = (batchId: number) => {
  searchQuery.value = `#${batchId}`;
};

// Quick add product
const showQuickProductDialog = async () => {
  if (suppliers.value.length === 0) {
    await fetchSuppliers();
  }
  if (units.value.length === 0) {
    await fetchUnits();
  }
  quickProductForm.value = { name: '', supplierId: null, unitId: null };
  quickProductDialogVisible.value = true;
};

const saveQuickProduct = async () => {
  if (!quickProductForm.value.name || !quickProductForm.value.supplierId || !quickProductForm.value.unitId) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('validation.required'),
      life: 3000,
    });
    return;
  }

  savingQuickAdd.value = true;
  try {
    const response = await api.post('/products', {
      name: quickProductForm.value.name,
      supplierId: quickProductForm.value.supplierId,
      unitId: quickProductForm.value.unitId,
    });
    
    await fetchProducts();
    formData.value.productId = response.data.id;
    formData.value.supplierId = quickProductForm.value.supplierId;
    
    quickProductDialogVisible.value = false;
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('products.messages.createSuccess'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.messages.saveFailed'),
      life: 3000,
    });
  } finally {
    savingQuickAdd.value = false;
  }
};

// Quick add supplier
const showQuickSupplierDialog = () => {
  quickSupplierForm.value = { name: '', contactPerson: '', email: '', phone: '' };
  quickSupplierDialogVisible.value = true;
};

const saveQuickSupplier = async () => {
  if (!quickSupplierForm.value.name) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('validation.required'),
      life: 3000,
    });
    return;
  }

  savingQuickAdd.value = true;
  try {
    const response = await api.post('/suppliers', quickSupplierForm.value);
    
    await fetchSuppliers();
    formData.value.supplierId = response.data.id;
    
    quickSupplierDialogVisible.value = false;
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('suppliers.messages.createSuccess'),
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('suppliers.messages.saveFailed'),
      life: 3000,
    });
  } finally {
    savingQuickAdd.value = false;
  }
};

// Fetch units
const fetchUnits = async () => {
  try {
    const response = await api.get('/units');
    units.value = response.data;
  } catch (error: any) {
    console.error('Failed to fetch units:', error);
  }
};

// Load data on mount
onMounted(() => {
  fetchPurchases();
  fetchProducts();
  fetchSuppliers();
  fetchLockedYears();
});
</script>

<style scoped>
.purchases-view {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.year-filter {
  min-width: 150px;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-badge {
  font-weight: 600;
  color: var(--primary-color);
}

.verification-number {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
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

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.product-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.text-secondary {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.year-warning {
  margin-top: 0.5rem;
}

.total-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 6px;
  border: 1px solid var(--surface-200);
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.p-invalid {
  border-color: var(--red-500);
}

.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.dropdown-with-add {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}
</style>
