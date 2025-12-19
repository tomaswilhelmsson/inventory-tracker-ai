<template>
  <div class="suppliers-view">
    <div class="header">
      <h1>Supplier Management</h1>
      <Button label="Add Supplier" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="filteredSuppliers"
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
                  placeholder="Search suppliers..."
                />
              </IconField>
            </div>
          </template>

          <Column field="name" header="Name" sortable />

          <Column header="Contact Person" sortable>
            <template #body="{ data }">
              {{ data.contactPerson || '-' }}
            </template>
          </Column>

          <Column header="Email" sortable>
            <template #body="{ data }">
              {{ data.email || '-' }}
            </template>
          </Column>

          <Column header="Phone" sortable>
            <template #body="{ data }">
              {{ data.phone || '-' }}
            </template>
          </Column>

          <Column field="createdAt" header="Created" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column header="Products" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data._count?.products || 0" severity="info" />
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
              <p>No suppliers found</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? 'Edit Supplier' : 'Add Supplier'"
      modal
      :style="{ width: '700px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field">
          <label for="name">Supplier Name *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            placeholder="Enter supplier name"
            autofocus
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="contactPerson">Contact Person</label>
            <InputText
              id="contactPerson"
              v-model="formData.contactPerson"
              placeholder="e.g., John Smith"
            />
          </div>

          <div class="field">
            <label for="phone">Phone Number</label>
            <InputText
              id="phone"
              v-model="formData.phone"
              placeholder="e.g., +1 234 567 8900"
            />
          </div>
        </div>

        <div class="field">
          <label for="email">Email Address</label>
          <InputText
            id="email"
            v-model="formData.email"
            :class="{ 'p-invalid': formErrors.email }"
            type="email"
            placeholder="e.g., supplier@example.com"
          />
          <small v-if="formErrors.email" class="p-error">{{ formErrors.email }}</small>
        </div>

        <div class="field">
          <label for="address">Street Address</label>
          <InputText
            id="address"
            v-model="formData.address"
            placeholder="e.g., 123 Main Street"
          />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="city">City</label>
            <InputText
              id="city"
              v-model="formData.city"
              placeholder="e.g., New York"
            />
          </div>

          <div class="field">
            <label for="country">Country</label>
            <InputText
              id="country"
              v-model="formData.country"
              placeholder="e.g., USA"
            />
          </div>
        </div>

        <div class="field">
          <label for="taxId">Tax ID / VAT Number</label>
          <InputText
            id="taxId"
            v-model="formData.taxId"
            placeholder="e.g., 12-3456789"
          />
        </div>

        <div class="field">
          <label for="notes">Notes</label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            rows="3"
            placeholder="Additional information about the supplier..."
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? 'Update' : 'Create'"
          :loading="saving"
          @click="saveSupplier"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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
import Tag from 'primevue/tag';

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  _count?: {
    products: number;
    purchases: number;
  };
}

interface FormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

const toast = useToast();
const confirm = useConfirm();

const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);
const currentSupplierId = ref<number | null>(null);

const formData = ref<FormData>({
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  notes: '',
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');

// Computed: filtered suppliers
const filteredSuppliers = computed(() => {
  if (!searchQuery.value) {
    return suppliers.value;
  }
  const query = searchQuery.value.toLowerCase();
  return suppliers.value.filter(s => 
    s.name.toLowerCase().includes(query) ||
    (s.contactPerson && s.contactPerson.toLowerCase().includes(query)) ||
    (s.email && s.email.toLowerCase().includes(query)) ||
    (s.phone && s.phone.toLowerCase().includes(query)) ||
    (s.city && s.city.toLowerCase().includes(query)) ||
    (s.country && s.country.toLowerCase().includes(query))
  );
});

// Fetch suppliers
const fetchSuppliers = async () => {
  loading.value = true;
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
    loading.value = false;
  }
};

// Open create dialog
const openCreateDialog = () => {
  editMode.value = false;
  currentSupplierId.value = null;
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = (supplier: Supplier) => {
  editMode.value = true;
  currentSupplierId.value = supplier.id;
  formData.value = {
    name: supplier.name,
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    city: supplier.city || '',
    country: supplier.country || '',
    taxId: supplier.taxId || '',
    notes: supplier.notes || '',
  };
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Supplier name is required';
  }

  // Validate email format if provided
  if (formData.value.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.email.trim())) {
      formErrors.value.email = 'Please enter a valid email address';
    }
  }

  return Object.keys(formErrors.value).length === 0;
};

// Save supplier (create or update)
const saveSupplier = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      contactPerson: formData.value.contactPerson.trim() || undefined,
      email: formData.value.email.trim() || undefined,
      phone: formData.value.phone.trim() || undefined,
      address: formData.value.address.trim() || undefined,
      city: formData.value.city.trim() || undefined,
      country: formData.value.country.trim() || undefined,
      taxId: formData.value.taxId.trim() || undefined,
      notes: formData.value.notes.trim() || undefined,
    };

    if (editMode.value && currentSupplierId.value) {
      // Update existing supplier
      await api.put(`/suppliers/${currentSupplierId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier updated successfully',
        life: 3000,
      });
    } else {
      // Create new supplier
      await api.post('/suppliers', payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Supplier created successfully',
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchSuppliers();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to save supplier',
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDelete = (supplier: Supplier) => {
  const productCount = supplier._count?.products || 0;
  const purchaseCount = supplier._count?.purchases || 0;

  if (productCount > 0 || purchaseCount > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Delete',
      detail: `This supplier has ${productCount} product(s) and ${purchaseCount} purchase(s). Delete those first.`,
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: `Are you sure you want to delete "${supplier.name}"?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteSupplier(supplier.id),
  });
};

// Delete supplier
const deleteSupplier = async (id: number) => {
  try {
    await api.delete(`/suppliers/${id}`);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Supplier deleted successfully',
      life: 3000,
    });
    await fetchSuppliers();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to delete supplier',
      life: 3000,
    });
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    notes: '',
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
  fetchSuppliers();
});
</script>

<style scoped>
.suppliers-view {
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

.p-invalid {
  border-color: var(--red-500);
}

.p-error {
  color: var(--red-500);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
