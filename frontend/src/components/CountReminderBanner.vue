<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../services/api';
import Message from 'primevue/message';
import Button from 'primevue/button';

const { t } = useI18n();
const router = useRouter();

const needsCount = ref(false);
const pendingYear = ref<number | null>(null);

async function checkPendingCount() {
  try {
    const response = await api.get('/year-end-count/pending-reminder');
    needsCount.value = response.data.needsCount;
    pendingYear.value = response.data.pendingYear;
  } catch (error) {
    console.error('Failed to check pending count:', error);
  }
}

function goToYearEndCount() {
  router.push('/year-end-count');
}

onMounted(() => {
  checkPendingCount();
});

defineExpose({ checkPendingCount });
</script>

<template>
  <div v-if="needsCount" class="count-reminder-banner">
    <Message severity="warn" :closable="false">
      <div class="reminder-content">
        <span>
          <i class="pi pi-exclamation-triangle"></i>
          <strong>{{ t('yearEndCount.reminder.title') }}:</strong>
          {{ t('yearEndCount.reminder.message', { year: pendingYear }) }}
        </span>
        <Button
          :label="t('yearEndCount.reminder.action')"
          icon="pi pi-arrow-right"
          size="small"
          @click="goToYearEndCount"
          outlined
        />
      </div>
    </Message>
  </div>
</template>

<style scoped>
.count-reminder-banner {
  margin-bottom: 1rem;
}

.reminder-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.reminder-content i {
  margin-right: 0.5rem;
}
</style>
