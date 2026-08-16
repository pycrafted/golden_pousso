import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Ajoute le token JWT si disponible
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tente un refresh si 401, sinon efface le token et laisse passer
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Ne pas boucler sur les endpoints d'auth eux-mêmes
    if (original.url?.includes('/auth/')) {
      localStorage.removeItem('access_token');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Récupère le refresh token depuis Zustand persist
      const stored = JSON.parse(localStorage.getItem('golden-pousso-auth') || '{}');
      const refreshToken = stored?.state?.refreshToken;

      if (!refreshToken) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });

      const newToken = data.access;
      localStorage.setItem('access_token', newToken);

      // Met aussi à jour Zustand persist
      if (stored?.state) {
        stored.state.token = newToken;
        localStorage.setItem('golden-pousso-auth', JSON.stringify(stored));
      }

      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      // Refresh échoué → déconnexion complète (état persisté inclus), endpoints publics fonctionnent sans token
      const wasAuthenticated = !!JSON.parse(localStorage.getItem('golden-pousso-auth') || '{}')?.state?.isAuthenticated;
      localStorage.removeItem('access_token');
      delete apiClient.defaults.headers.common.Authorization;
      processQueue(new Error('session expirée'), null);

      const { default: useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().logout();
      if (wasAuthenticated) toast.error('Session expirée, veuillez vous reconnecter.');

      // Réessaye sans token pour les endpoints publics
      delete original.headers.Authorization;
      original._retry = true;
      return apiClient(original);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
