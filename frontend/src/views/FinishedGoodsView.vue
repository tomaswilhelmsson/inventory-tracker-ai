<template>
  <div class="finished-goods-view">
    <div class="header">
      <h1>{{ t('finishedGoods.title') }}</h1>
      <div class="header-actions">
        <Button
          :label="showInactive ? t('common.hideDisabled') : t('common.showDisabled')"
          :icon="showInactive ? 'pi pi-eye-slash' : 'pi pi-eye'"
          text
          @click="showInactive = !showInactive"
        />
        <Button :label="t('finishedGoods.addFinishedGood')" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="filteredFinishedGoods"
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
                  :placeholder="t('finishedGoods.searchFinishedGoods')"
                />
              </IconField>
            </div>
          </template>

          <Column field="name" :header="t('finishedGoods.table.name')" sortable>
            <template #body="{ data }">
              <span :class="{ 'disabled-item': !data.isActive }">
                {{ data.name }}
              </span>
              <Tag v-if="!data.isActive" :value="t('common.disabled')" severity="secondary" class="ml-2" />
            </template>
          </Column>

          <Column field="unit.name" :header="t('finishedGoods.table.unit')" sortable style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.unit?.name || t('units.names.pieces')" severity="secondary" />
            </template>
          </Column>

          <Column field="description" :header="t('finishedGoods.table.description')" sortable>
            <template #body="{ data }">
              <span class="description-text">{{ data.description || '—' }}</span>
            </template>
          </Column>

          <Column field="materialCost" :header="t('finishedGoods.table.materialCost')" sortable style="width: 150px">
            <template #body="{ data }">
              <span class="material-cost">{{ formatCurrency(data.materialCost) }}</span>
            </template>
          </Column>

          <Column field="createdAt" :header="t('finishedGoods.table.created')" sortable style="width: 150px">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
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
                  :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'"
                  size="small"
                  text
                  rounded
                  :severity="data.isActive ? 'danger' : 'success'"
                  @click="toggleActive(data)"
                  v-tooltip.top="data.isActive ? t('common.disable') : t('common.enable')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? t('finishedGoods.editFinishedGood') : t('finishedGoods.addFinishedGood')"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="resetForm"
    >
      <div class="form-grid">
        <div class="form-field">
          <label for="name">{{ t('finishedGoods.form.name') }} *</label>
          <InputText
            id="name"
            v-model="formData.name"
            :class="{ 'p-invalid': formErrors.name }"
            :placeholder="t('finishedGoods.form.namePlaceholder')"
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="form-field">
          <label for="description">{{ t('finishedGoods.form.description') }}</label>
          <Textarea
            id="description"
            v-model="formData.description"
            rows="3"
            :placeholder="t('finishedGoods.form.descriptionPlaceholder')"
          />
        </div>

        <div class="form-field">
          <label for="unit">{{ t('finishedGoods.form.unit') }} *</label>
          <Dropdown
            id="unit"
            v-model="formData.unitId"
            :options="units"
            optionLabel="name"
            optionValue="id"
            :placeholder="t('finishedGoods.form.selectUnit')"
            :class="{ 'p-invalid': formErrors.unitId }"
            :loading="loadingUnits"
          />
          <small v-if="formErrors.unitId" class="p-error">{{ formErrors.unitId }}</small>
        </div>

        <div class="form-field">
          <label for="materialCost">{{ t('finishedGoods.form.materialCost') }} *</label>
          <InputNumber
            id="materialCost"
            v-model="formData.materialCost"
            mode="currency"
            currency="SEK"
            locale="sv-SE"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0"
            :class="{ 'p-invalid': formErrors.materialCost }"
            :placeholder="t('finishedGoods.form.materialCostPlaceholder')"
          />
          <small v-if="formErrors.materialCost" class="p-error">{{ formErrors.materialCost }}</small>
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.cancel')" icon="pi pi-times" text @click="dialogVisible = false" />
        <Button
          :label="t('common.save')"
          icon="pi pi-check"
          :loading="saving"
          @click="saveFinishedGood"
        />
      </template>
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
import InputNumber from 'primevue/inputnumber';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';

interface Unit {
  id: number;
  name: string;
}

interface FinishedGood {
  id: number;
  name: string;
  description?: string;
  unitId: number;
  unit?: Unit;
  materialCost: number;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  name: string;
  description: string;
  unitId: number | null;
  materialCost: number | null;
}

interface FormErrors {
  name?: string;
  unitId?: string;
  materialCost?: string;
}

const toast = useToast();
const confirm = useConfirm();
const { t } = useI18n();

const finishedGoods = ref<FinishedGood[]>([]);
const units = ref<Unit[]>([]);
const loading = ref(false);
const loadingUnits = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editMode = ref(false);
const currentFinishedGoodId = ref<number | null>(null);

const formData = ref<FormData>({
  name: '',
  description: '',
  unitId: null,
  materialCost: null,
});

const formErrors = ref<FormErrors>({});
const searchQuery = ref('');
const showInactive = ref(false);

// Filtered finished goods based on search and show disabled
const filteredFinishedGoods = computed(() => {
  let filtered = finishedGoods.value;
  
  if (!showInactive.value) {
    filtered = filtered.filter(fg => fg.isActive);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(fg => 
      fg.name.toLowerCase().includes(query) ||
      (fg.description && fg.description.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Fetch finished goods
const fetchFinishedGoods = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (showInactive.value) {
      params.append('includeInactive', 'true');
    }
    const response = await api.get(`/finished-goods?${params.toString()}`);
    finishedGoods.value = response.data;
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
  if (units.value.length === 0) {
    await fetchUnits();
  }

  editMode.value = false;
  currentFinishedGoodId.value = null;
  formData.value = {
    name: '',
    description: '',
    unitId: null,
    materialCost: null,
  };
  formErrors.value = {};
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = (finishedGood: FinishedGood) => {
  if (units.value.length === 0) {
    fetchUnits();
  }

  editMode.value = true;
  currentFinishedGoodId.value = finishedGood.id;
  formData.value = {
    name: finishedGood.name,
    description: finishedGood.description || '',
    unitId: finishedGood.unitId,
    materialCost: finishedGood.materialCost,
  };
  formErrors.value = {};
  dialogVisible.value = true;
};

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {};
  let isValid = true;

  if (!formData.value.name || formData.value.name.trim() === '') {
    formErrors.value.name = t('finishedGoods.validation.nameRequired');
    isValid = false;
  }

  if (!formData.value.unitId) {
    formErrors.value.unitId = t('finishedGoods.validation.unitRequired');
    isValid = false;
  }

  if (formData.value.materialCost === null || formData.value.materialCost < 0) {
    formErrors.value.materialCost = t('finishedGoods.validation.materialCostRequired');
    isValid = false;
  }

  return isValid;
};

// Save finished good
const saveFinishedGood = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: formData.value.name.trim(),
      description: formData.value.description?.trim() || undefined,
      unitId: formData.value.unitId,
      materialCost: formData.value.materialCost,
    };

    if (editMode.value && currentFinishedGoodId.value) {
      await api.put(`/finished-goods/${currentFinishedGoodId.value}`, payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('finishedGoods.updatedSuccessfully'),
        life: 3000,
      });
    } else {
      await api.post('/finished-goods', payload);
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('finishedGoods.createdSuccessfully'),
        life: 3000,
      });
    }

    dialogVisible.value = false;
    fetchFinishedGoods();
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

// Toggle active status
const toggleActive = (finishedGood: FinishedGood) => {
  const action = finishedGood.isActive ? 'disable' : 'enable';
  
  confirm.require({
    message: t(`finishedGoods.confirmations.${action}`, { name: finishedGood.name }),
    header: t('common.confirmation'),
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: t('common.yes'),
    rejectLabel: t('common.no'),
    accept: async () => {
      try {
        if (finishedGood.isActive) {
          await api.delete(`/finished-goods/${finishedGood.id}`);
          toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('finishedGoods.disabledSuccessfully'),
            life: 3000,
          });
        } else {
          // Re-enable by updating isActive back to true
          await api.put(`/finished-goods/${finishedGood.id}`, {
            name: finishedGood.name,
            description: finishedGood.description,
            unitId: finishedGood.unitId,
            materialCost: finishedGood.materialCost,
            isActive: true,
          });
          toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('finishedGoods.enabledSuccessfully'),
            life: 3000,
          });
        }
        fetchFinishedGoods();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: t('common.error'),
          detail: error.response?.data?.error || t('common.error'),
          life: 3000,
        });
      }
    },
  });
};

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    unitId: null,
    materialCost: null,
  };
  formErrors.value = {};
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 2,
  }).format(value);
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Watch showDisabled to refetch when toggled
watch(showInactive, () => {
  fetchFinishedGoods();
});

// Initial fetch
onMounted(() => {
  fetchFinishedGoods();
});
</script>

<style scoped>
.finished-goods-view {
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  margin: 0;
  font-size: 1.75rem;
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

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.disabled-item {
  opacity: 0.6;
  text-decoration: line-through;
}

.material-cost {
  font-weight: 500;
  color: var(--primary-color);
}

.description-text {
  color: var(--text-color-secondary);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  font-size: 0.9rem;
}

.p-error {
  color: var(--red-500);
  font-size: 0.85rem;
}
</style>
