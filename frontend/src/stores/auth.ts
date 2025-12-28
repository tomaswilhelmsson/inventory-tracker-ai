import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import { usePreferencesStore } from './preferences';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<{ id: number; username: string } | null>(null);
  const isAuthenticated = ref(!!token.value);

  async function login(username: string, password: string) {
    try {
      const response = await api.post('/auth/login', { username, password });
      token.value = response.data.token;
      user.value = response.data.user;
      isAuthenticated.value = true;
      
      localStorage.setItem('token', response.data.token);
      
      // Load user preferences from server after successful login
      const preferencesStore = usePreferencesStore();
      if (response.data.user?.preferences) {
        // Use preferences from login response if available
        preferencesStore.language = response.data.user.preferences.language || 'en';
        preferencesStore.currency = response.data.user.preferences.currency || 'USD';
        preferencesStore.isLoaded = true;
      } else {
        // Otherwise fetch from /auth/me
        await preferencesStore.loadPreferences();
      }
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('token');
    
    // Reset preferences on logout
    const preferencesStore = usePreferencesStore();
    preferencesStore.resetPreferences();
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };
});
