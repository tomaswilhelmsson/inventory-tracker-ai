<template>
  <div class="currency-selector">
    <Dropdown
      v-model="selectedCurrency"
      :options="currencies"
      optionLabel="name"
      optionValue="code"
      @change="changeCurrency"
      class="currency-dropdown"
    >
      <template #value="slotProps">
        <div class="currency-value" v-if="slotProps.value">
          <span>{{ slotProps.value }}</span>
        </div>
      </template>
      <template #option="slotProps">
        <div class="currency-option">
          <span>{{ slotProps.option.code }} - {{ slotProps.option.name }}</span>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Dropdown from 'primevue/dropdown';
import { usePreferencesStore } from '@/stores/preferences';
import { useAuthStore } from '@/stores/auth';

const preferencesStore = usePreferencesStore();
const authStore = useAuthStore();

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
];

const selectedCurrency = ref(preferencesStore.currency);

// Sync with preferences store on mount
onMounted(() => {
  if (authStore.isAuthenticated) {
    selectedCurrency.value = preferencesStore.currency;
  }
});

// Watch for preference store currency changes
watch(() => preferencesStore.currency, (newCurrency) => {
  selectedCurrency.value = newCurrency;
});

async function changeCurrency() {
  const newCurrency = selectedCurrency.value as 'USD' | 'SEK';
  
  // Save to server if authenticated
  if (authStore.isAuthenticated) {
    try {
      await preferencesStore.updateCurrency(newCurrency);
    } catch (error) {
      console.error('Failed to save currency preference:', error);
      // Preferences store will rollback on error, so we need to sync back
      selectedCurrency.value = preferencesStore.currency;
    }
  } else {
    // For unauthenticated users, just update localStorage
    preferencesStore.currency = newCurrency;
  }
}
</script>

<style scoped>
.currency-selector {
  display: flex;
  align-items: center;
}

.currency-dropdown {
  min-width: 100px;
}

.currency-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
