<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Card from 'primevue/card';
import LanguageSelector from '../components/LanguageSelector.vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const username = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('validation.required'),
      life: 3000,
    });
    return;
  }

  loading.value = true;
  const result = await authStore.login(username.value, password.value);
  loading.value = false;

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('login.loginSuccess'),
      life: 3000,
    });
    router.push('/');
  } else {
    toast.add({
      severity: 'error',
      summary: t('login.loginFailed'),
      detail: result.error || t('login.invalidCredentials'),
      life: 3000,
    });
  }
}
</script>

<template>
  <div class="login-container">
    <div class="lang-selector-login">
      <LanguageSelector />
    </div>
    <Card class="login-card">
      <template #title>
        <div class="login-header">
          <h2>📦 Inventory Tracker</h2>
          <p>FIFO Inventory Management System</p>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="username">{{ t('login.username') }}</label>
            <InputText
              id="username"
              v-model="username"
              :placeholder="t('login.username')"
              class="w-full"
              :disabled="loading"
            />
          </div>

          <div class="field">
            <label for="password">{{ t('login.password') }}</label>
            <Password
              id="password"
              v-model="password"
              :placeholder="t('login.password')"
              :feedback="false"
              toggleMask
              :disabled="loading"
              :pt="{
                root: { class: 'w-full' },
                input: { class: 'w-full' }
              }"
            />
          </div>

          <Button
            type="submit"
            :label="t('login.loginButton')"
            icon="pi pi-sign-in"
            class="w-full"
            :loading="loading"
          />

          <div class="hint">
            <small>Default credentials: admin / admin123</small>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.lang-selector-login {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0 0 0.5rem 0;
  color: #1976d2;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
  color: #333;
}

.w-full {
  width: 100%;
}

.hint {
  text-align: center;
  color: #666;
  margin-top: -0.5rem;
}
</style>
