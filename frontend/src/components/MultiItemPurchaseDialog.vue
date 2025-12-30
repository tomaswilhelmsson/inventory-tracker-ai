<template>
  <Dialog
    v-model:visible="visible"
    :header="$t('purchases.multiItem.title')"
    modal
    :style="{ width: '90vw', maxWidth: '1200px' }"
    :closeOnEscape="false"
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
                autoFilterFocus
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
              :manualInput="true"
              @blur="handleDateInput"
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
              v-normalize-decimal
              :mode="currency.inputNumberMode.value"
              :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
              :locale="currency.inputNumberLocale.value"
              :minFractionDigits="2"
              :min="0"
              :useGrouping="false"
              :placeholder="$t('purchases.multiItem.invoiceTotalPlaceholder')"
              :class="{ 'p-invalid': formErrors.invoiceTotal }"
              @update:modelValue="recalculateTotals"
            />
            <small v-if="formErrors.invoiceTotal" class="p-error">{{ formErrors.invoiceTotal }}</small>
            <small v-else class="field-hint">{{ $t('purchases.multiItem.invoiceTotalHint') }}</small>
          </div>

          <div class="field">
            <label for="shippingCost">{{ $t('purchases.multiItem.shippingCost') }} *</label>
            <InputNumber
              id="shippingCost"
              v-model="formData.shippingCost"
              v-normalize-decimal
              :mode="currency.inputNumberMode.value"
              :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
              :locale="currency.inputNumberLocale.value"
              :minFractionDigits="2"
              :min="0"
              :useGrouping="false"
              :placeholder="$t('purchases.multiItem.shippingCostPlaceholder')"
              @update:modelValue="recalculateTotals"
            />
            <label class="checkbox-label">
              <Checkbox
                v-model="formData.shippingIncludesVAT"
                :binary="true"
                @update:modelValue="recalculateTotals"
              />
              {{ $t('purchases.multiItem.shippingIncludesVAT') }}
            </label>
          </div>

          <div class="field">
            <label for="vatRate">{{ $t('purchases.form.vatRate') }}</label>
            <InputNumber
              id="vatRate"
              v-model="formData.vatRate"
              suffix="%"
              :minFractionDigits="0"
              :maxFractionDigits="2"
              :min="0"
              :max="100"
              :placeholder="$t('purchases.form.vatRatePlaceholder')"
              @update:modelValue="recalculateTotals"
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
                @change="recalculateTotals"
              />
              {{ $t('purchases.form.pricesIncludeVAT') }}
            </label>
            <small class="field-hint">{{ $t('purchases.form.pricesIncludeVATHint') }}</small>
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

        <DataTable :value="formData.items" class="line-items-table" scrollable scrollHeight="400px" :rowClass="getLineItemRowClass">
          <Column :header="$t('purchases.table.product')" style="min-width: 200px">
            <template #body="{ data, index }">
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <Dropdown
                  v-model="data.productId"
                  :options="filteredProducts"
                  optionLabel="name"
                  optionValue="id"
                  :placeholder="$t('purchases.form.productPlaceholder')"
                  filter
                  autoFilterFocus
                  :loading="loadingProducts"
                  @change="onProductSelect(index)"
                  style="flex: 1;"
                >
                  <template #option="slotProps">
                    <div class="product-option">
                      <div>{{ slotProps.option.name }}</div>
                      <small class="text-secondary">
                        {{ $t('purchases.form.supplier') }}: {{ getProductSupplierName(slotProps.option) }}
                      </small>
                    </div>
                  </template>
                </Dropdown>
                <Button
                  icon="pi pi-plus"
                  size="small"
                  text
                  rounded
                  @click="showQuickProductDialog(index)"
                  v-tooltip.top="$t('products.addProduct')"
                />
              </div>
            </template>
          </Column>

          <Column :header="$t('products.form.unit')" style="min-width: 100px">
            <template #body="{ data }">
              <span v-if="data.productId" class="unit-display">
                {{ getProductUnit(data.productId) }}
              </span>
            </template>
          </Column>

          <Column :header="$t('purchases.table.quantity')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.quantity"
                :min="0.01"
                :minFractionDigits="0"
                :maxFractionDigits="2"
                :useGrouping="true"
                :placeholder="$t('purchases.form.quantityPlaceholder')"
                @update:modelValue="onQuantityChange(index)"
              />
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.unitCost')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.unitCost"
                v-normalize-decimal
                :mode="currency.inputNumberMode.value"
                :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
                :locale="currency.inputNumberLocale.value"
                :minFractionDigits="2"
                :min="0"
                :useGrouping="false"
                :disabled="data.totalCost !== null && data.totalCost !== undefined"
                :placeholder="$t('purchases.form.unitCostPlaceholder')"
                @update:modelValue="onUnitCostChange(index)"
              />
            </template>
          </Column>

          <Column :header="$t('purchases.multiItem.totalCost')" style="min-width: 120px">
            <template #body="{ data, index }">
              <InputNumber
                v-model="data.totalCost"
                v-normalize-decimal
                :mode="currency.inputNumberMode.value"
                :currency="currency.inputNumberMode.value === 'currency' ? currency.currencyCode.value : undefined"
                :locale="currency.inputNumberLocale.value"
                :minFractionDigits="2"
                :min="0"
                :useGrouping="false"
                :disabled="data.unitCost !== null && data.unitCost !== undefined"
                :placeholder="$t('purchases.multiItem.totalCostPlaceholder')"
                @update:modelValue="onTotalCostChange(index)"
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

      <!-- INVOICE MISMATCH ALERT - Big visual warning (MOVED TO TOP) -->
      <div v-if="invoiceTotalMismatch !== null" class="alert-box alert-warning attention-pulse">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Invoice Total Mismatch!</strong>
          <p>
            Entered: {{ formatCurrency(formData.invoiceTotal) }} |
            Calculated: {{ formatCurrency(calculatedTotal) }} |
            <span class="highlight">Difference: {{ formatCurrency(Math.abs(invoiceTotalMismatch)) }}</span>
          </p>
        </div>
      </div>

      <!-- Summary section -->
      <div class="summary-section">
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.subtotalExclVAT') }}:</span>
          <strong>{{ formatCurrency(subtotalExclVAT) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.subtotalInclVAT') }}:</span>
          <strong>{{ formatCurrency(subtotalInclVAT) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.shipping') }}:</span>
          <strong>{{ formatCurrency(formData.shippingCost || 0) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.totalExclVAT') }}:</span>
          <strong>{{ formatCurrency(totalExclVAT) }}</strong>
        </div>
        <div class="summary-row">
          <span>{{ $t('purchases.multiItem.vatAmount') }} ({{ formData.vatRate }}%):</span>
          <strong>{{ formatCurrency(vatAmount) }}</strong>
        </div>
        <div class="summary-row total-row">
          <span>{{ $t('purchases.multiItem.totalInclVAT') }}:</span>
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

  <!-- Quick Add Product Dialog -->
  <Dialog
    v-model:visible="quickProductDialogVisible"
    :header="$t('products.addProduct')"
    modal
    :style="{ width: '500px' }"
  >
    <div class="form-container">
      <div class="field">
        <label for="quickProductName">{{ $t('products.form.name') }} *</label>
        <InputText
          id="quickProductName"
          v-model="quickProductForm.name"
          :placeholder="$t('products.form.namePlaceholder')"
          autofocus
        />
      </div>

      <div class="field">
        <label for="quickProductSupplier">{{ $t('products.form.supplier') }} *</label>
        <Dropdown
          id="quickProductSupplier"
          v-model="quickProductForm.supplierId"
          :options="suppliers"
          optionLabel="name"
          optionValue="id"
          :placeholder="$t('products.form.supplierPlaceholder')"
          filter
          autoFilterFocus
        />
      </div>

      <div class="field">
        <label for="quickProductUnit">{{ $t('products.form.unit') }} *</label>
        <Dropdown
          id="quickProductUnit"
          v-model="quickProductForm.unitId"
          :options="units"
          optionLabel="name"
          optionValue="id"
          :placeholder="$t('products.form.unitPlaceholder')"
          filter
          autoFilterFocus
        />
      </div>
    </div>

    <template #footer>
      <Button :label="$t('common.cancel')" text @click="closeQuickProductDialog" />
      <Button
        :label="$t('common.create')"
        :loading="savingQuickProduct"
        @click="saveQuickProduct"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import api from '@/services/api';
import { useCurrency } from '@/composables/useCurrency';
import { parseDateString } from '@/utils/dateFormatter';

import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Message from 'primevue/message';
import Checkbox from 'primevue/checkbox';

const { t, n } = useI18n();
const toast = useToast();
const currency = useCurrency();

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

// Quick add product
const quickProductDialogVisible = ref(false);
const quickProductForm = ref({
  name: '',
  supplierId: null as number | null,
  unitId: null as number | null,
});
const quickProductRowIndex = ref<number | null>(null);
const savingQuickProduct = ref(false);
const units = ref<any[]>([]);

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
  shippingIncludesVAT: true, // Default: shipping includes VAT
  vatRate: 25, // Default 25% VAT
  pricesIncludeVAT: true, // Default: prices include VAT
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
  if (!formData.value.supplierId) {
    return products.value;
  }
  
  // Filter products that have this supplier in their suppliers array
  return products.value.filter(p => 
    p.suppliers && p.suppliers.some(ps => ps.supplierId === formData.value.supplierId)
  );
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

// VAT calculations
const vatRateDecimal = computed(() => {
  return (formData.value.vatRate || 0) / 100;
});

const subtotalExclVAT = computed(() => {
  if (formData.value.pricesIncludeVAT) {
    // Convert from incl VAT to excl VAT
    return calculatedSubtotal.value / (1 + vatRateDecimal.value);
  } else {
    // Already excl VAT
    return calculatedSubtotal.value;
  }
});

const subtotalInclVAT = computed(() => {
  if (formData.value.pricesIncludeVAT) {
    // Already incl VAT
    return calculatedSubtotal.value;
  } else {
    // Convert from excl VAT to incl VAT
    return calculatedSubtotal.value * (1 + vatRateDecimal.value);
  }
});

const shippingExclVAT = computed(() => {
  const shipping = formData.value.shippingCost || 0;
  if (formData.value.shippingIncludesVAT) {
    // Convert from incl VAT to excl VAT
    return shipping / (1 + vatRateDecimal.value);
  } else {
    // Already excl VAT
    return shipping;
  }
});

const shippingInclVAT = computed(() => {
  const shipping = formData.value.shippingCost || 0;
  if (formData.value.shippingIncludesVAT) {
    // Already incl VAT
    return shipping;
  } else {
    // Convert from excl VAT to incl VAT
    return shipping * (1 + vatRateDecimal.value);
  }
});

const totalExclVAT = computed(() => {
  return subtotalExclVAT.value + shippingExclVAT.value;
});

const totalInclVAT = computed(() => {
  return subtotalInclVAT.value + shippingInclVAT.value;
});

const vatAmount = computed(() => {
  return totalInclVAT.value - totalExclVAT.value;
});

const calculatedTotal = computed(() => {
  // Grand total is always incl VAT
  return totalInclVAT.value;
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
      // Check if product has the selected supplier in its suppliers array
      const hasSupplier = product?.suppliers?.some(ps => ps.supplierId === formData.value.supplierId);
      if (product && !hasSupplier) {
        item.productId = null;
      }
    }
  });
  supplierMismatchError.value = '';
}

// Handle manual date input to fix parsing issues
function handleDateInput(event: any) {
  const value = event.target?.value;
  if (value && typeof value === 'string') {
    const date = parseDateString(value);
    if (date) {
      formData.value.purchaseDate = date;
    }
  }
}

function onProductSelect(index: number) {
  const item = formData.value.items[index];
  const product = products.value.find(p => p.id === item.productId);
  
  if (product) {
    // Auto-set supplier if this is the first product (use first supplier from product's suppliers)
    if (!formData.value.supplierId && product.suppliers && product.suppliers.length > 0) {
      formData.value.supplierId = product.suppliers[0].supplierId;
    }
    
    // Check if product has the selected supplier in its suppliers array
    const hasSupplier = product.suppliers?.some(ps => ps.supplierId === formData.value.supplierId);
    if (!hasSupplier) {
      supplierMismatchError.value = t('purchases.multiItem.supplierMismatch');
      item.productId = null;
    } else {
      supplierMismatchError.value = '';
    }
  }
}

function onQuantityChange(index: number) {
  const item = formData.value.items[index];
  
  if (!item.quantity || item.quantity <= 0) {
    // Clear calculations if quantity is invalid
    item.unitCost = null;
    recalculateTotals();
    return;
  }
  
  if (item.unitCost) {
    // User entered unit cost, clear total cost
    item.totalCost = null;
  }
  // If totalCost is set, keep it as is (don't calculate unitCost)
  // The backend will calculate unitCost from totalCost
  
  recalculateTotals();
}

function onUnitCostChange(index: number) {
  const item = formData.value.items[index];
  item.totalCost = null; // Disable totalCost field
  recalculateTotals();
}

function onTotalCostChange(index: number) {
  const item = formData.value.items[index];
  
  // Clear unit cost when user enters total cost
  // The backend will calculate unitCost from totalCost
  item.unitCost = null;
  
  recalculateTotals();
}

function recalculateTotals() {
  const subtotal = calculatedSubtotal.value;
  const shipping = formData.value.shippingCost || 0;
  
  // Calculate shipping allocation for each item
  formData.value.items.forEach((item, index) => {
    // Check if we have enough information to calculate
    if (!item.quantity || item.quantity <= 0) {
      item.shippingAllocation = 0;
      item.finalUnitCost = 0;
      return;
    }
    
    // Need either unitCost or totalCost
    if (!item.unitCost && !item.totalCost) {
      item.shippingAllocation = 0;
      item.finalUnitCost = 0;
      return;
    }
    
    // Calculate item subtotal and base unit cost
    let itemSubtotal: number;
    let baseUnitCost: number;
    
    if (item.totalCost && item.totalCost > 0) {
      // User entered total cost
      itemSubtotal = item.totalCost;
      baseUnitCost = item.totalCost / item.quantity;
    } else if (item.unitCost && item.unitCost > 0) {
      // User entered unit cost
      itemSubtotal = item.quantity * item.unitCost;
      baseUnitCost = item.unitCost;
    } else {
      // Invalid cost data
      item.shippingAllocation = 0;
      item.finalUnitCost = 0;
      return;
    }
    
    // Calculate shipping allocation
    const shippingAllocation = subtotal > 0 ? (itemSubtotal / subtotal) * shipping : 0;
    const shippingPerUnit = shippingAllocation / item.quantity;
    
    // Set final values
    item.shippingAllocation = shippingAllocation;
    item.finalUnitCost = baseUnitCost + shippingPerUnit;
  });
}

// Visual feedback: Color-code line item rows based on completion status
function getLineItemRowClass(data: LineItem): string {
  const hasProduct = !!data.productId;
  const hasQuantity = data.quantity && data.quantity > 0;
  const hasCost = (data.unitCost !== null && data.unitCost !== undefined) || 
                   (data.totalCost !== null && data.totalCost !== undefined);
  
  // Complete: all required fields present
  if (hasProduct && hasQuantity && hasCost) {
    return 'row-complete';
  }
  
  // Partial: some fields entered
  if (hasProduct || hasQuantity || hasCost) {
    return 'row-partial';
  }
  
  // Empty: nothing entered
  return 'row-empty';
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
      // Format date preserving local date (not UTC) to avoid timezone shifts
      purchaseDate: `${formData.value.purchaseDate.getFullYear()}-${String(formData.value.purchaseDate.getMonth() + 1).padStart(2, '0')}-${String(formData.value.purchaseDate.getDate()).padStart(2, '0')}`,
      invoiceTotal: formData.value.invoiceTotal,
      verificationNumber: formData.value.verificationNumber || undefined,
      shippingCost: formData.value.shippingCost || 0,
      shippingIncludesVAT: formData.value.shippingIncludesVAT,
      vatRate: formData.value.vatRate ? formData.value.vatRate / 100 : 0, // Convert percentage to decimal
      pricesIncludeVAT: formData.value.pricesIncludeVAT,
      notes: formData.value.notes || undefined,
      items: formData.value.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        // Send only totalCost if it was entered by user, otherwise send unitCost
        // (Backend expects one or the other, not both)
        ...(item.totalCost !== null 
          ? { totalCost: item.totalCost }
          : { unitCost: item.unitCost }
        ),
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
    shippingIncludesVAT: true,
    vatRate: 25,
    pricesIncludeVAT: true,
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
      detail: t('products.messages.loadFailed'),
      life: 3000,
    });
  } finally {
    loadingProducts.value = false;
  }
}

async function loadUnits() {
  try {
    const response = await api.get('/units');
    units.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('units.messages.loadFailed'),
      life: 3000,
    });
  }
}

// Get supplier name for a product (prioritize selected supplier)
function getProductSupplierName(product: any): string {
  if (!product.suppliers || product.suppliers.length === 0) {
    return t('common.unknown');
  }
  
  // If a supplier is selected in the form, show that supplier if it's associated with this product
  if (formData.value.supplierId) {
    const matchingSupplier = product.suppliers.find(
      (ps: any) => ps.supplierId === formData.value.supplierId
    );
    if (matchingSupplier?.supplier?.name) {
      return matchingSupplier.supplier.name;
    }
  }
  
  // Otherwise, show the first supplier
  if (product.suppliers[0]?.supplier?.name) {
    return product.suppliers[0].supplier.name;
  }
  
  return t('common.unknown');
}

// Get product unit name
function getProductUnit(productId: number): string {
  const product = products.value.find(p => p.id === productId);
  if (!product?.unit?.name) {
    return t('units.names.pieces'); // Default fallback
  }
  return product.unit.name;
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

// Quick add product functions
function showQuickProductDialog(rowIndex: number) {
  quickProductRowIndex.value = rowIndex;
  quickProductForm.value = {
    name: '',
    supplierId: formData.value.supplierId, // Pre-fill supplier
    unitId: null,
  };
  quickProductDialogVisible.value = true;
}

async function saveQuickProduct() {
  // Validate required fields
  if (!quickProductForm.value.name || !quickProductForm.value.supplierId || !quickProductForm.value.unitId) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('products.quickAdd.requiredFields'),
      life: 3000,
    });
    return;
  }

  savingQuickProduct.value = true;
  try {
    const response = await api.post('/products', {
      name: quickProductForm.value.name,
      supplierIds: [quickProductForm.value.supplierId], // API expects array
      unitId: quickProductForm.value.unitId,
    });
    
    await loadProducts();
    
    // Auto-select new product in the triggering row
    if (quickProductRowIndex.value !== null) {
      formData.value.items[quickProductRowIndex.value].productId = response.data.id;
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('products.quickAdd.createSuccess', { name: response.data.name }),
      life: 3000,
    });
    
    closeQuickProductDialog();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('products.quickAdd.createFailed'),
      life: 3000,
    });
  } finally {
    savingQuickProduct.value = false;
  }
}

function closeQuickProductDialog() {
  quickProductDialogVisible.value = false;
  quickProductForm.value = {
    name: '',
    supplierId: null,
    unitId: null,
  };
  quickProductRowIndex.value = null;
}

watch(visible, (newVal) => {
  if (newVal) {
    loadSuppliers();
    loadProducts();
    loadUnits();
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

.field .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 400;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  cursor: pointer;
  user-select: none;
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

.unit-display {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--surface-100);
  border-radius: 4px;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-weight: 500;
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
