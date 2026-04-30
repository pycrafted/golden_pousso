import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (phone, password) => {
        const res = await apiClient.post('/auth/login/', { phone, password });
        const { user, access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        set({ user, token: access, refreshToken: refresh, isAuthenticated: true });
        return user;
      },

      register: async (data) => {
        const res = await apiClient.post('/auth/register/', data);
        const { user, access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        set({ user, token: access, refreshToken: refresh, isAuthenticated: true });
        return user;
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      updateProfile: async (data) => {
        const isFormData = data instanceof FormData;
        const res = await apiClient.patch('/auth/me/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
        set({ user: res.data });
        return res.data;
      },

      changePassword: async (currentPassword, newPassword) => {
        await apiClient.post('/auth/change-password/', { current_password: currentPassword, new_password: newPassword });
      },

      fetchProfile: async () => {
        try {
          const res = await apiClient.get('/auth/me/');
          set({ user: res.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'golden-pousso-auth',
      partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    }
  )
);

export default useAuthStore;
