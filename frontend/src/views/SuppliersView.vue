<template>
  <div class="suppliers-view">
    <div class="header">
      <h1>{{ t('suppliers.title') }}</h1>
      <Button :label="t('suppliers.addSupplier')" icon="pi pi-plus" @click="openCreateDialog" />
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
                  :placeholder="t('suppliers.searchSuppliers')"
                />
              </IconField>
            </div>
          </template>

          <Column field="name" :header="t('suppliers.table.name')" sortable />

          <Column :header="t('suppliers.table.contactPerson')" sortable>
            <template #body="{ data }">
              {{ data.contactPerson || '-' }}
            </template>
          </Column>

          <Column :header="t('suppliers.table.email')" sortable>
            <template #body="{ data }">
              {{ data.email || '-' }}
            </template>
          </Column>

          <Column :header="t('suppliers.table.phone')" sortable>
            <template #body="{ data }">
              {{ data.phone || '-' }}
            </template>
          </Column>

          <Column field="createdAt" :header="t('suppliers.table.created')" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column :header="t('suppliers.table.products')" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data._count?.products || 0" severity="info" />
            </template>
          </Column>

          <Column :header="t('suppliers.table.purchases')" style="width: 100px">
            <template #body="{ data }">
              <Tag :value="data._count?.purchases || 0" severity="success" />
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
                  v-tooltip.top="t('common.edit')"
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
      :header="editMode ? t('suppliers.editSupplier') : t('suppliers.addSupplier')"
      modal
      :style="{ width: '700px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field">
          <label for="name">{{ t('suppliers.form.name') }} *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            :placeholder="t('suppliers.form.namePlaceholder')"
            autofocus
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="contactPerson">{{ t('suppliers.form.contactPerson') }}</label>
            <InputText
              id="contactPerson"
              v-model="formData.contactPerson"
              :placeholder="t('suppliers.form.contactPersonPlaceholder')"
            />
          </div>

          <div class="field">
            <label for="phone">{{ t('suppliers.form.phone') }}</label>
            <InputText
              id="phone"
              v-model="formData.phone"
              :placeholder="t('suppliers.form.phonePlaceholder')"
            />
          </div>
        </div>

        <div class="field">
          <label for="email">{{ t('suppliers.form.email') }}</label>
          <InputText
            id="email"
            v-model="formData.email"
            :class="{ 'p-invalid': formErrors.email }"
            type="email"
            :placeholder="t('suppliers.form.emailPlaceholder')"
          />
          <small v-if="formErrors.email" class="p-error">{{ formErrors.email }}</small>
        </div>

        <div class="field">
          <label for="address">{{ t('suppliers.form.address') }}</label>
          <InputText
            id="address"
            v-model="formData.address"
            :placeholder="t('suppliers.form.addressPlaceholder')"
          />
        </div>

        <div class="field-row">
          <div class="field">
            <label for="city">{{ t('suppliers.form.city') }}</label>
            <InputText
              id="city"
              v-model="formData.city"
              :placeholder="t('suppliers.form.cityPlaceholder')"
            />
          </div>

          <div class="field">
            <label for="country">{{ t('suppliers.form.country') }}</label>
            <InputText
              id="country"
              v-model="formData.country"
              :placeholder="t('suppliers.form.countryPlaceholder')"
            />
          </div>
        </div>

        <div class="field">
          <label for="taxId">{{ t('suppliers.form.taxId') }}</label>
          <InputText
            id="taxId"
            v-model="formData.taxId"
            :placeholder="t('suppliers.form.taxIdPlaceholder')"
          />
        </div>

        <div class="field">
          <label for="notes">{{ t('suppliers.form.notes') }}</label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            rows="3"
            :placeholder="t('suppliers.form.notesPlaceholder')"
          />
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? t('common.edit') : t('common.add')"
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
import { useI18n } from 'vue-i18n';
import api from '@/services/api';

const { t } = useI18n();

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
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
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
    formErrors.value.name = t('validation.required');
  }

  // Validate email format if provided
  if (formData.value.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.value.email.trim())) {
      formErrors.value.email = t('validation.invalidEmail');
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
        summary: t('common.success'),
        detail: t('suppliers.messages.updateSuccess'),
        life: 3000,
      });
    } else {
      // Create new supplier
      await api.post('/suppliers', payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('suppliers.messages.createSuccess'),
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchSuppliers();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
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
      summary: t('suppliers.messages.cannotDelete'),
      detail: t('suppliers.messages.deleteWarning', { products: productCount, purchases: purchaseCount }),
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: t('suppliers.messages.deleteConfirm', { name: supplier.name }),
    header: t('common.confirm'),
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
      summary: t('common.success'),
      detail: t('suppliers.messages.deleteSuccess'),
      life: 3000,
    });
    await fetchSuppliers();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.error || t('common.error'),
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
