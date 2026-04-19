import { create } from 'zustand';
import { api, tokenStorage } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user:            JSON.parse(localStorage.getItem('signova_user') || 'null'),
  isAuthenticated: !!tokenStorage.getAccess(),
  isLoading:       false,
  error:           null,

  /* ── Login ── */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/login', { email, password });
      tokenStorage.setAccess(data.accessToken);
      tokenStorage.setRefresh(data.refreshToken);
      localStorage.setItem('signova_user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  /* ── Register ── */
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/register', { name, email, password });
      tokenStorage.setAccess(data.accessToken);
      tokenStorage.setRefresh(data.refreshToken);
      localStorage.setItem('signova_user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  /* ── Logout ── */
  logout: async () => {
    try {
      await api.post('/auth/logout', { refreshToken: tokenStorage.getRefresh() });
    } catch { /* ignore */ }
    tokenStorage.clear();
    localStorage.removeItem('signova_user');
    set({ user: null, isAuthenticated: false, error: null });
  },

  /* ── Logout all devices ── */
  logoutAll: async () => {
    try { await api.post('/auth/logout-all', {}); } catch { /* ignore */ }
    tokenStorage.clear();
    localStorage.removeItem('signova_user');
    set({ user: null, isAuthenticated: false });
  },

  /* ── Fetch fresh user from server ── */
  fetchMe: async () => {
    try {
      const data = await api.get('/auth/me');
      localStorage.setItem('signova_user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true });
      return data.user;
    } catch {
      get().logout();
    }
  },

  /* ── Update local user data ── */
  updateUser: (data) => {
    set((state) => {
      const updated = { ...state.user, ...data };
      localStorage.setItem('signova_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  clearError: () => set({ error: null }),

  getAuthHeader: () => {
    const t = tokenStorage.getAccess();
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
}));

// Auto logout on token expiry (triggered from api.js)
window.addEventListener('signova:logout', () => {
  useAuthStore.getState().logout();
});
