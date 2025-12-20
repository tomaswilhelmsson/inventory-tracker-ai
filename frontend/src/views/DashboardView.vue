<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';

const { t, n } = useI18n();
const loading = ref(true);
const inventoryData = ref<any>(null);

async function loadDashboard() {
  try {
    const response = await api.get('/inventory/value');
    inventoryData.value = response.data;
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <div class="dashboard">
    <h1>{{ t('dashboard.title') }}</h1>

    <div v-if="loading" class="loading">
      <ProgressSpinner />
    </div>

    <div v-else-if="inventoryData" class="stats-grid">
      <Card>
        <template #title>{{ t('dashboard.totalInventoryValue') }}</template>
        <template #content>
          <div class="stat-value">{{ n(inventoryData.totalValue, 'currency') }}</div>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('inventory.totalUnits') }}</template>
        <template #content>
          <div class="stat-value">{{ n(inventoryData.totalQuantity, 'integer') }}</div>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('dashboard.activeProducts') }}</template>
        <template #content>
          <div class="stat-value">{{ inventoryData.products.length }}</div>
        </template>
      </Card>
    </div>

    <div v-if="inventoryData" class="products-section">
      <h2>{{ t('dashboard.inventoryOverview') }}</h2>
      <Card>
        <template #content>
          <div class="products-list">
            <div
              v-for="product in inventoryData.products"
              :key="product.productId"
              class="product-item"
            >
              <div class="product-name">{{ product.productName }}</div>
              <div class="product-stats">
                <span>{{ t('inventory.table.totalQuantity') }}: {{ n(product.quantity, 'integer') }} {{ product.unit?.name || t('units.names.pieces') }}</span>
                <span>{{ t('inventory.table.totalValue') }}: {{ n(product.value, 'currency') }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
}

h1 {
  margin-bottom: 2rem;
  color: #333;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1976d2;
  text-align: center;
  padding: 1rem 0;
}

.products-section h2 {
  margin-bottom: 1rem;
  color: #333;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
}

.product-name {
  font-weight: 600;
  color: #333;
}

.product-stats {
  display: flex;
  gap: 2rem;
  color: #666;
}
</style>
