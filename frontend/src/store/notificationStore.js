import { create } from 'zustand';
import { api } from '../lib/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,
  isLoading:     false,
  pagination:    { total: 0, page: 1, limit: 20, totalPages: 1 },

  /* ── Fetch notifications ── */
  fetchNotifications: async ({ page = 1, unreadOnly = false } = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page, limit: '20' });
      if (unreadOnly) params.set('unread', 'true');
      const data = await api.get(`/notifications?${params}`);
      set({
        notifications: data.notifications || [],
        unreadCount:   data.unreadCount   || 0,
        pagination:    data.pagination    || get().pagination,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  /* ── Fetch unread count only (lightweight) ── */
  fetchUnreadCount: async () => {
    try {
      const data = await api.get('/notifications/unread-count');
      set({ unreadCount: data.unreadCount || 0 });
    } catch { /* silent */ }
  },

  /* ── Push incoming socket notification ── */
  pushNotification: (notification) => {
    set((state) => ({
      notifications:  [notification, ...state.notifications],
      unreadCount:    state.unreadCount + 1,
    }));
  },

  /* ── Mark one as read ── */
  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`, {});
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, readStatus: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  /* ── Mark all as read ── */
  markAllRead: async () => {
    await api.patch('/notifications/read-all', {});
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, readStatus: true })),
      unreadCount: 0,
    }));
  },

  /* ── Delete one ── */
  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      unreadCount: state.notifications.find((n) => n.id === id && !n.readStatus)
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
  },

  /* ── Clear all read ── */
  clearRead: async () => {
    await api.delete('/notifications');
    set((state) => ({
      notifications: state.notifications.filter((n) => !n.readStatus),
    }));
  },
}));
