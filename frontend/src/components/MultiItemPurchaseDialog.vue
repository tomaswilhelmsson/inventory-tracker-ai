<template>
  <Dialog
    v-model:visible="visible"
    :header="$t('purchases.multiItem.title')"
    modal
    :style="{ width: '90vw', maxWidth: '1200px' }"
    @hide="resetForm"
  >
    <div class="multi-item-purchase-form">
      <!-- Batch-level fields -->
      <div class="batch-fields">
        <div class="field-row">
          <div class="field">
            <label for="supplier">{{ $t('purchases.form.supplier') }} *</label>
            <div class="dropdown-with-add">
              <Dropdown
                id="supplier"
                v-model="formData.supplierId"
                :options="suppliers"
                optionLabel="name"
                optionValue="id"
                :placeholder="$t('purchases.form.supplierPlaceholder')"
                :class="{ 'p-invalid': formErrors.supplierId }"
                :loading="loadingSuppliers"
                filter
                @change="onSupplierChange"
                style="flex: 1"
              />
              <Button
                icon="pi pi-plus"
                size="small"
                outlined
                @click="showQuickSupplierDialog"
                v-tooltip.top="$t('suppliers.addSupplier')"
              />
            </div>
            <small v-if="formErrors.supplierId" class="p-error">{{ formErrors.supplierId }}</small>
          </div>

          <div class="field">
            <label for="purchaseDate">{{ $t('purchases.form.purchaseDate') }} *</label>
            <DatePicker
              id="purchaseDate"
              v-model="formData.purchaseDate"
              :class="{ 'p-invalid': formErrors.purchaseDate }"
              dateFormat="yy-mm-dd"
              showIcon
            />
            <small v-if="formErrors.purchaseDate" class="p-error">{{ formErrors.purchaseDate }}</small>
          </div>

          <div class="field">
            <label for="verificationNumber">{{ $t('purchases.form.verificationNumber') }}</label>
            <InputText
              id="verificationNumber"
              v-model="formData.verificationNumber"
              :placeholder="$t('purchases.form.verificationNumberPlaceholder')"
              maxlength="100"
            />
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="invoiceTotal">{{ $t('purchases.multiItem.invoiceTotal') }} *</label>
            <InputNumber
              id="invoiceTotal"
              v-model="formData.invoiceTotal"
              mode="currency"
              currency="USD"
              :minFractionDigits="2"
              :min="0"
              :placeholder="$t('purchases.multiItem.invoiceTotalPlaceholder')"
              :class="{ 'p-invalid': formErrors.invoiceTotal }"
              @input="recalculateTotals"
            />
            <small v-if="formErrors.invoiceTotal" class="p-error">{{ formErrors.invoiceTotal }}</small>
            <small v-else class="field-hint">{{ $t('purchases.multiItem.invoiceTotalHint') }}</small>
          </div>

          <div class="field">
            <label for="shippingCost">{{ $t('purchases.multiItem.shippingCost') }} *</label>
            <InputNumber
              id="shippingCost"
              v-model="formData.shippingCost"
              mode="currency"
              currency="USD"
              :minFractionDigits="2"
              :min="0"
              :placeholder="$t('purchases.multiItem.shippingCostPlaceholder')"
              @input="recalculateTotals"
            />
          </div>

          <div class="field">
            <label for="notes">{{ $t('purchases.multiItem.notes') }}</label>
            <InputText
              id="notes"
              v-model="formData.notes"
              :placeholder="$t('purchases.multiItem.notesPlaceholder')"
              maxlength="1000"
            />
          </div>
        </div>
      </div>

      <!-- Line items table -->
      <div class="line-items-section">
        <div class="section-header">
          <h3>{{ $t('purchases.multiItem.lineItems') }}</h3>
          <Button
            :label="$t('purchases.multiItem.addItem')"
            icon="pi pi-plus"
            size="small"
            @click="addLineItem"
          />
        </div>

        <DataTable :value="formData.items" class="line-items-table" scrollable scrollHeight="400px">
          <Column :header="$t('purchases.table.product')" style="min-width: 200px">
            <template #body="{ data, index }">
              <Dropdown
                v-model="data.productId"
                :options="filteredProducts"
                optionLabel="name"
                optionValue="id"
                :placeholder="$t('purchases.form.productPlaceholder')"
                filter
                :loading="loadingProducts"
                @change="onProductSelect(index)"
              >
                <template #option="slotProps">
                  <div class="product-option">
                    <div>{{ slotProps.option.name }}</div>
                    <small class="text-secondary">
                      {{ $t('purchases.form.supplier') }}: {{ slotProps.option.supplier?.name || $t('common.unknown') }}
                    </small>
                  </div>
                </template>
              </Dropdown>
            </template>
          </Column>

          <Column :header="$t('purchases.table.quantity')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.quantity"
                :min="1"
                :useGrouping="true"
                :placeholder="$t('purchases.form.quantityPlaceholder')"
                @input="onQuantityChange(index)"
              />
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.unitCost')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.unitCost"
                mode="currency"
                currency="USD"
                :minFractionDigits="2"
                :min="0"
                :disabled="data.totalCost !== null && data.totalCost !== undefined"
                :placeholder="$t('purchases.form.unitCostPlaceholder')"
                @input="onUnitCostChange(index)"
              />
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.totalCost')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.totalCost"
                mode="currency"
                currency="USD"
                :minFractionDigits="2"
                :min="0"
                :disabled="data.unitCost !== null && data.unitCost !== undefined"
                :placeholder="$t('purchases.multiItem.totalCostPlaceholder')"
                @input="onTotalCostChange(index)"
              />
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.shipping')" style="min-width: 100px">
            <template #body="{ data }">
              <span class="shipping-allocation">{{ formatCurrency(data.shippingAllocation || 0) }}</span>
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.finalUnitCost')" style="min-width: 120px">
            <template #body="{ data }">
              <strong class="final-cost">{{ formatCurrency(data.finalUnitCost || 0) }}</strong>
            </template>
          </Column>

          <Column :header="$t('common.actions')" style="min-width: 80px">
            <template #body="{ index }">
              <Button
                icon="pi pi-trash"
                size="small"
                text
                rounded
                severity="danger"
                :disabled="formData.items.length === 1"
                @click="removeLineItem(index)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Summary section -->
      <div class="summary-section">
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.subtotal') }}:</span>
          <strong>{{ formatCurrency(calculatedSubtotal) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.shipping') }}:</span>
          <strong>{{ formatCurrency(formData.shippingCost || 0) }}</strong>
        </div>
        <div class="summary-row total-row">
          <span>{{ $t('purchases.multiItem.total') }}:</span>
          <strong>{{ formatCurrency(calculatedTotal) }}</strong>
        </div>
        <div v-if="validationMessage" :class="['validation-message', validationStatus]">
          <i :class="validationIcon"></i>
          {{ validationMessage }}
        </div>
      </div>

      <!-- Validation errors -->
      <Message v-if="supplierMismatchError" severity="error" :closable="false">
        {{ supplierMismatchError }}
      </Message>
    </div>

    <template #footer>
      <Button :label="$t('common.cancel')" text @click="visible = false" />
      <Button
        :label="$t('common.create')"
        :loading="saving"
        :disabled="!canSubmit"
        @click="saveBatch"
      />
    </template>
  </Dialog>

  <!-- Quick Add Supplier Dialog -->
  <Dialog
    v-model:visible="quickSupplierDialogVisible"
    :header="$t('suppliers.addSupplier')"
    modal
    :style="{ width: '500px' }"
  >
    <div class="form-container">
      <div class="field">
        <label for="quickSupplierName">{{ $t('suppliers.form.name') }} *</label>
        <InputText
          id="quickSupplierName"
          v-model="quickSupplierForm.name"
          :placeholder="$t('suppliers.form.namePlaceholder')"
          autofocus
        />
      </div>

      <div class="field">
        <label for="quickSupplierContact">{{ $t('suppliers.form.contactPerson') }}</label>
        <InputText
          id="quickSupplierContact"
          v-model="quickSupplierForm.contactPerson"
          :placeholder="$t('suppliers.form.contactPersonPlaceholder')"
        />
      </div>

      <div class="field">
        <label for="quickSupplierEmail">{{ $t('suppliers.form.email') }}</label>
        <InputText
          id="quickSupplierEmail"
          v-model="quickSupplierForm.email"
          type="email"
          :placeholder="$t('suppliers.form.emailPlaceholder')"
        />
      </div>

      <div class="field">
        <label for="quickSupplierPhone">{{ $t('suppliers.form.phone') }}</label>
        <InputText
          id="quickSupplierPhone"
          v-model="quickSupplierForm.phone"
          :placeholder="$t('suppliers.form.phonePlaceholder')"
        />
      </div>
    </div>

    <template #footer>
      <Button :label="$t('common.cancel')" text @click="quickSupplierDialogVisible = false" />
      <Button
        :label="$t('common.create')"
        :loading="savingQuickAdd"
        @click="saveQuickSupplier"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';

const { t, n } = useI18n();
const toast = useToast();

const emit = defineEmits(['batch-created']);

const visible = defineModel<boolean>('visible', { default: false });

const suppliers = ref<any[]>([]);
const products = ref<any[]>([]);
const loadingSuppliers = ref(false);
const loadingProducts = ref(false);
const saving = ref(false);

// Quick add supplier
const quickSupplierDialogVisible = ref(false);
const quickSupplierForm = ref({ name: '', contactPerson: '', email: '', phone: '' });
const savingQuickAdd = ref(false);

interface LineItem {
  productId: number | null;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
  shippingAllocation: number;
  finalUnitCost: number;
}

const formData = ref({
  supplierId: null as number | null,
  purchaseDate: new Date(),
  verificationNumber: '',
  invoiceTotal: null as number | null,
  shippingCost: 0,
  notes: '',
  items: [createEmptyLineItem()] as LineItem[],
});

const formErrors = ref({
  supplierId: '',
  purchaseDate: '',
  invoiceTotal: '',
});

function createEmptyLineItem(): LineItem {
  return {
    productId: null,
    quantity: null,
    unitCost: null,
    totalCost: null,
    shippingAllocation: 0,
    finalUnitCost: 0,
  };
}

const filteredProducts = computed(() => {
  if (!formData.value.supplierId) return products.value;
  return products.value.filter(p => p.supplierId === formData.value.supplierId);
});

const calculatedSubtotal = computed(() => {
  return formData.value.items.reduce((sum, item) => {
    if (item.quantity && item.unitCost) {
      return sum + (item.quantity * item.unitCost);
    } else if (item.totalCost) {
      return sum + item.totalCost;
    }
    return sum;
  }, 0);
});

const calculatedTotal = computed(() => {
  return calculatedSubtotal.value + (formData.value.shippingCost || 0);
});

const validationStatus = computed(() => {
  const allItemsValid = formData.value.items.every(item => 
    item.productId && item.quantity && (item.unitCost || item.totalCost)
  );
  if (invoiceTotalMismatch.value !== null) {
    return 'warning';
  }
  return allItemsValid ? 'valid' : 'invalid';
});

const validationIcon = computed(() => {
  if (validationStatus.value === 'valid') return 'pi pi-check-circle';
  if (validationStatus.value === 'warning') return 'pi pi-exclamation-triangle';
  return 'pi pi-exclamation-circle';
});

const invoiceTotalMismatch = computed(() => {
  if (!formData.value.invoiceTotal || formData.value.invoiceTotal <= 0) return null;
  const diff = Math.abs(calculatedTotal.value - formData.value.invoiceTotal);
  // Allow $0.01 tolerance for rounding
  if (diff > 0.01) {
    return diff;
  }
  return null;
});

const validationMessage = computed(() => {
  if (invoiceTotalMismatch.value !== null) {
    const diff = invoiceTotalMismatch.value;
    return t('purchases.multiItem.invoiceMismatch', { 
      calculated: formatCurrency(calculatedTotal.value),
      entered: formatCurrency(formData.value.invoiceTotal!),
      diff: formatCurrency(diff)
    });
  }
  if (validationStatus.value === 'valid') {
    return t('purchases.multiItem.validationSuccess');
  }
  return t('purchases.multiItem.validationIncomplete');
});

const supplierMismatchError = ref('');

const canSubmit = computed(() => {
  return (
    formData.value.supplierId &&
    formData.value.invoiceTotal !== null &&
    formData.value.invoiceTotal > 0 &&
    formData.value.items.length > 0 &&
    formData.value.items.every(item => 
      item.productId && item.quantity && (item.unitCost || item.totalCost)
    ) &&
    !supplierMismatchError.value
    // Note: invoiceTotalMismatch is a warning, not a blocker
  );
});

function formatCurrency(value: number): string {
  return n(value, 'currency');
}

function addLineItem() {
  formData.value.items.push(createEmptyLineItem());
}

function removeLineItem(index: number) {
  if (formData.value.items.length > 1) {
    formData.value.items.splice(index, 1);
    recalculateTotals();
  }
}

function onSupplierChange() {
  // Clear products that don't match new supplier
  formData.value.items.forEach(item => {
    if (item.productId) {
      const product = products.value.find(p => p.id === item.productId);
      if (product && product.supplierId !== formData.value.supplierId) {
        item.productId = null;
      }
    }
  });
  supplierMismatchError.value = '';
}

function onProductSelect(index: number) {
  const item = formData.value.items[index];
  const product = products.value.find(p => p.id === item.productId);
  
  if (product) {
    // Auto-set supplier if this is the first product
    if (!formData.value.supplierId) {
      formData.value.supplierId = product.supplierId;
    }
    
    // Check if product belongs to selected supplier
    if (product.supplierId !== formData.value.supplierId) {
      supplierMismatchError.value = t('purchases.multiItem.supplierMismatch');
      item.productId = null;
    } else {
      supplierMismatchError.value = '';
    }
  }
}

function onQuantityChange(index: number) {
  const item = formData.value.items[index];
  
  if (item.quantity && item.unitCost) {
    item.totalCost = null; // Clear totalCost when quantity changes with unitCost
  } else if (item.quantity && item.totalCost) {
    // Recalculate unit cost from total cost
    item.unitCost = item.totalCost / item.quantity;
  }
  
  recalculateTotals();
}

function onUnitCostChange(index: number) {
  const item = formData.value.items[index];
  item.totalCost = null; // Disable totalCost field
  recalculateTotals();
}

function onTotalCostChange(index: number) {
  const item = formData.value.items[index];
  
  // Calculate unit cost from total cost
  if (item.totalCost && item.quantity) {
    item.unitCost = item.totalCost / item.quantity;
  }
  
  recalculateTotals();
}

function recalculateTotals() {
  const subtotal = calculatedSubtotal.value;
  const shipping = formData.value.shippingCost || 0;
  
  // Calculate shipping allocation for each item
  formData.value.items.forEach(item => {
    if (item.quantity && (item.unitCost || item.totalCost)) {
      const itemSubtotal = item.totalCost || (item.quantity * item.unitCost!);
      const shippingAllocation = subtotal > 0 ? (itemSubtotal / subtotal) * shipping : 0;
      const shippingPerUnit = item.quantity > 0 ? shippingAllocation / item.quantity : 0;
      
      const baseUnitCost = item.unitCost || (item.totalCost! / item.quantity);
      
      item.shippingAllocation = shippingAllocation;
      item.finalUnitCost = baseUnitCost + shippingPerUnit;
    } else {
      item.shippingAllocation = 0;
      item.finalUnitCost = 0;
    }
  });
}

async function saveBatch() {
  // Validate
  formErrors.value = {
    supplierId: formData.value.supplierId ? '' : t('purchases.multiItem.errors.supplierRequired'),
    purchaseDate: formData.value.purchaseDate ? '' : t('purchases.multiItem.errors.dateRequired'),
    invoiceTotal: formData.value.invoiceTotal && formData.value.invoiceTotal > 0 ? '' : t('purchases.multiItem.errors.invoiceTotalRequired'),
  };

  if (Object.values(formErrors.value).some(e => e)) {
    return;
  }

  saving.value = true;

  try {
    const payload = {
      supplierId: formData.value.supplierId,
      purchaseDate: formData.value.purchaseDate.toISOString(),
      verificationNumber: formData.value.verificationNumber || undefined,
      shippingCost: formData.value.shippingCost || 0,
      notes: formData.value.notes || undefined,
      items: formData.value.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost !== null ? item.unitCost : undefined,
        totalCost: item.totalCost !== null ? item.totalCost : undefined,
      })),
    };

    await api.post('/purchases/batch', payload);

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('purchases.multiItem.createSuccess'),
      life: 3000,
    });

    emit('batch-created');
    visible.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.message || t('purchases.multiItem.createError'),
      life: 5000,
    });
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  formData.value = {
    supplierId: null,
    purchaseDate: new Date(),
    verificationNumber: '',
    invoiceTotal: null,
    shippingCost: 0,
    notes: '',
    items: [createEmptyLineItem()],
  };
  formErrors.value = {
    supplierId: '',
    purchaseDate: '',
    invoiceTotal: '',
  };
  supplierMismatchError.value = '';
}

async function loadSuppliers() {
  loadingSuppliers.value = true;
  try {
    const response = await api.get('/suppliers');
    suppliers.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('suppliers.errors.loadFailed'),
      life: 3000,
    });
  } finally {
    loadingSuppliers.value = false;
  }
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const response = await api.get('/products');
    products.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('products.errors.loadFailed'),
      life: 3000,
    });
  } finally {
    loadingProducts.value = false;
  }
}

// Quick add supplier
function showQuickSupplierDialog() {
  quickSupplierForm.value = { name: '', contactPerson: '', email: '', phone: '' };
  quickSupplierDialogVisible.value = true;
}

async function saveQuickSupplier() {
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
    
    await loadSuppliers();
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
}

watch(visible, (newVal) => {
  if (newVal) {
    loadSuppliers();
    loadProducts();
  }
});

defineExpose({ resetForm });
</script>

<style scoped>
.multi-item-purchase-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.batch-fields {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: var(--border-radius);
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: var(--text-color);
}

.line-items-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.line-items-table {
  font-size: 0.9rem;
}

.product-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.shipping-allocation,
.final-cost {
  display: block;
  text-align: right;
}

.final-cost {
  color: var(--primary-color);
}

.summary-section {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-top: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.summary-row.total-row {
  border-top: 2px solid var(--surface-border);
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-size: 1.1rem;
}

.validation-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.validation-message.valid {
  background: var(--green-50);
  color: var(--green-700);
}

.validation-message.invalid {
  background: var(--orange-50);
  color: var(--orange-700);
}

.validation-message.warning {
  background: var(--yellow-50);
  color: var(--yellow-700);
}

.validation-message i {
  font-size: 1.25rem;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.p-error {
  color: var(--red-500);
  font-size: 0.875rem;
}

.p-invalid {
  border-color: var(--red-500);
}

.text-secondary {
  color: var(--text-color-secondary);
}

.dropdown-with-add {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}
</style>
