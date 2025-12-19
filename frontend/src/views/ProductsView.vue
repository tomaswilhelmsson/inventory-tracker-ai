<template>
  <div class="products-view">
    <div class="header">
      <h1>Product Catalog</h1>
      <Button label=t("products.addProduct") icon="pi pi-plus" @click="openCreateDialog" />
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
                  placeholder="Search products..."
                />
              </IconField>
            </div>
          </template>

          <Column field="name" header="Product Name" sortable />

          <Column field="unit.name" header="Unit" sortable style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.unit?.name || 'pieces'" severity="secondary" />
            </template>
          </Column>

          <Column field="description" header="Description" sortable>
            <template #body="{ data }">
              <span class="description-text">{{ data.description || '—' }}</span>
            </template>
          </Column>

          <Column field="supplier.name" header="Supplier" sortable>
            <template #body="{ data }">
              <Tag :value="data.supplier?.name || 'Unknown'" severity="info" />
            </template>
          </Column>

          <Column field="createdAt" header="Created" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column header="Purchases" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data._count?.purchases || 0" severity="success" />
            </template>
          </Column>

          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditDialog(data)"
                  v-tooltip.top="'Edit'"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="confirmDelete(data)"
                  v-tooltip.top="'Delete'"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" style="font-size: 3rem; color: var(--text-color-secondary)"></i>
              <p>No products found</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? 'Edit Product' : 'Add Product'"
      modal
      :style="{ width: '600px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field">
          <label for="name">Product Name *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            placeholder="Enter product name"
            autofocus
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field">
          <label for="description">Description</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Product description (optional)"
          />
        </div>

        <div class="field">
          <label for="unit">Unit of Measure *</label>
          <Dropdown
            id="unit"
            v-model="formData.unitId"
            :options="units"
            optionLabel="name"
            optionValue="id"
            placeholder="Select unit"
            :class="{ 'p-invalid': formErrors.unitId }"
            :loading="loadingUnits"
          />
          <small v-if="formErrors.unitId" class="p-error">{{ formErrors.unitId }}</small>
        </div>

        <div class="field">
          <label for="supplier">Supplier *</label>
          <Dropdown
            id="supplier"
            v-model="formData.supplierId"
            :options="suppliers"
            optionLabel="name"
            optionValue="id"
            placeholder="Select a supplier"
            :class="{ 'p-invalid': formErrors.supplierId }"
            :loading="loadingSuppliers"
            filter
          >
            <template #option="slotProps">
              <div class="supplier-option">
                <div>{{ slotProps.option.name }}</div>
                <small v-if="slotProps.option.contactInfo" class="text-secondary">
                  {{ slotProps.option.contactInfo }}
                </small>
              </div>
            </template>
          </Dropdown>
          <small v-if="formErrors.supplierId" class="p-error">{{ formErrors.supplierId }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? 'Update' : 'Create'"
          :loading="saving"
          @click="saveProduct"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

interface Product {
  id: number;
  name: string;
  description?: string;
  unitId: number;
  unit?: Unit;
  supplierId: number;
  createdAt: string;
  supplier?: Supplier;
  _count?: {
    purchases: number;
  };
}

interface FormData {
  name: string;
  description: string;
  unitId: number | null;
  supplierId: number | null;
}

interface FormErrors {
  name?: string;
  unitId?: string;
  supplierId?: string;
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
  supplierId: null,
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');

// Computed: filtered products
const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value;
  }
  const query = searchQuery.value.toLowerCase();
  return products.value.filter(p => 
    p.name.toLowerCase().includes(query) ||
    (p.description && p.description.toLowerCase().includes(query)) ||
    (p.supplier?.name && p.supplier.name.toLowerCase().includes(query))
  );
});

// Fetch products
const fetchProducts = async () => {
  loading.value = true;
  try {
    const response = await api.get('/products');
    products.value = response.data;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to load products',
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
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to load suppliers',
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
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to load units',
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
      summary: 'No Suppliers',
      detail: 'Please create a supplier first before adding products',
      life: 5000,
    });
    return;
  }

  if (units.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'No Units',
      detail: 'Please create a unit first before adding products',
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
    supplierId: product.supplierId,
  };
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Product name is required';
  }

  if (!formData.value.unitId) {
    formErrors.value.unitId = 'Unit is required';
  }

  if (!formData.value.supplierId) {
    formErrors.value.supplierId = 'Supplier is required';
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
      supplierId: formData.value.supplierId,
    };

    if (editMode.value && currentProductId.value) {
      // Update existing product
      await api.put(`/products/${currentProductId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product updated successfully',
        life: 3000,
      });
    } else {
      // Create new product
      await api.post('/products', payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product created successfully',
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to save product',
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
      summary: 'Cannot Delete',
      detail: `This product has ${purchaseCount} purchase lot(s). Delete those first.`,
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: `Are you sure you want to delete "${product.name}"?`,
    header: 'Confirm Deletion',
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
      summary: 'Success',
      detail: 'Product deleted successfully',
      life: 3000,
    });
    await fetchProducts();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to delete product',
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
    supplierId: null,
  };
  formErrors.value = {};
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
</style>
