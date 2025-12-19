<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useI18n } from 'vue-i18n';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import LanguageSelector from './components/LanguageSelector.vue';

const authStore = useAuthStore();
const { t } = useI18n();
</script>

<template>
  <div id="app">
    <Toast />
    <ConfirmDialog />
    
    <div v-if="authStore.isAuthenticated" class="layout">
      <!-- Navigation -->
      <nav class="navbar">
        <div class="navbar-brand">
          <h1>📦 Inventory Tracker</h1>
        </div>
        <div class="navbar-menu">
          <RouterLink to="/" class="nav-link">{{ t('nav.dashboard') }}</RouterLink>
          <RouterLink to="/suppliers" class="nav-link">{{ t('nav.suppliers') }}</RouterLink>
          <RouterLink to="/products" class="nav-link">{{ t('nav.products') }}</RouterLink>
          <RouterLink to="/units" class="nav-link">{{ t('nav.units') }}</RouterLink>
          <RouterLink to="/purchases" class="nav-link">{{ t('nav.purchases') }}</RouterLink>
          <RouterLink to="/inventory" class="nav-link">{{ t('nav.inventory') }}</RouterLink>
          <RouterLink to="/year-end-count" class="nav-link">{{ t('nav.yearEndCount') }}</RouterLink>
          <RouterLink to="/reports" class="nav-link">{{ t('nav.reports') }}</RouterLink>
        </div>
        <div class="navbar-user">
          <LanguageSelector />
          <span class="user-name">{{ authStore.user?.username }}</span>
          <button @click="authStore.logout" class="btn-logout">{{ t('nav.logout') }}</button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="content">
        <RouterView />
      </main>
    </div>

    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #1976d2;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-menu {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  justify-content: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}

.content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
}
</style>
