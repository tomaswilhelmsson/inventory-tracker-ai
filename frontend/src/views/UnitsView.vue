<template>
  <div class="units-view">
    <div class="header">
      <h1>Units Management</h1>
      <Button label="Add Unit" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="filteredUnits"
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
                  placeholder="Search units..."
                />
              </IconField>
            </div>
          </template>

          <Column field="name" header="Unit Name" sortable />

          <Column field="createdAt" header="Created" sortable>
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>

          <Column header="Products" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data._count?.products || 0" severity="info" />
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
              <p>No units found</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? 'Edit Unit' : 'Add Unit'"
      modal
      :style="{ width: '450px' }"
      @hide="resetForm"
    >
      <div class="form-container">
        <div class="field">
          <label for="name">Unit Name *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            placeholder="Enter unit name (e.g., pieces, kg, liters)"
            autofocus
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? 'Update' : 'Create'"
          :loading="saving"
          @click="saveUnit"
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
import Tag from 'primevue/tag';

interface Unit {
  id: number;
  name: string;
  createdAt: string;
  _count?: {
    products: number;
  };
}

interface FormData {
  name: string;
}

interface FormErrors {
  name?: string;
}

const toast = useToast();
const confirm = useConfirm();

const units = ref<Unit[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);
const currentUnitId = ref<number | null>(null);

const formData = ref<FormData>({
  name: '',
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');

// Computed: filtered units
const filteredUnits = computed(() => {
  if (!searchQuery.value) {
    return units.value;
  }
  const query = searchQuery.value.toLowerCase();
  return units.value.filter(u => 
    u.name.toLowerCase().includes(query)
  );
});

// Fetch units
const fetchUnits = async () => {
  loading.value = true;
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
    loading.value = false;
  }
};

// Open create dialog
const openCreateDialog = () => {
  editMode.value = false;
  currentUnitId.value = null;
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = (unit: Unit) => {
  editMode.value = true;
  currentUnitId.value = unit.id;
  formData.value = {
    name: unit.name,
  };
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};

  if (!formData.value.name.trim()) {
    formErrors.value.name = 'Unit name is required';
  }

  return Object.keys(formErrors.value).length === 0;
};

// Save unit (create or update)
const saveUnit = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
    };

    if (editMode.value && currentUnitId.value) {
      // Update existing unit
      await api.put(`/units/${currentUnitId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Unit updated successfully',
        life: 3000,
      });
    } else {
      // Create new unit
      await api.post('/units', payload);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Unit created successfully',
        life: 3000,
      });
    }

    dialogVisible.value = false;
    await fetchUnits();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to save unit',
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};

// Confirm delete
const confirmDelete = (unit: Unit) => {
  const productCount = unit._count?.products || 0;

  if (productCount > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Delete',
      detail: `This unit is used by ${productCount} product(s). Reassign those products before deleting this unit.`,
      life: 5000,
    });
    return;
  }

  confirm.require({
    message: `Are you sure you want to delete unit "${unit.name}"?`,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteUnit(unit.id),
  });
};

// Delete unit
const deleteUnit = async (id: number) => {
  try {
    await api.delete(`/units/${id}`);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Unit deleted successfully',
      life: 3000,
    });
    await fetchUnits();
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to delete unit',
      life: 3000,
    });
  }
};

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
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
  fetchUnits();
});
</script>

<style scoped>
.units-view {
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
</style>
