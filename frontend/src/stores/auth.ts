import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

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
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  };
});
