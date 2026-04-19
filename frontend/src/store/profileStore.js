import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';

export const useProfileStore = create((set) => ({
  profile:   null,
  isLoading: false,
  error:     null,
  isSaving:  false,

  /* ── Fetch own profile ── */
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/profile/me');
      set({ profile: data.user, isLoading: false });
      useAuthStore.getState().updateUser(data.user);
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /* ── Fetch any user's public profile ── */
  fetchPublicProfile: async (userId) => {
    const data = await api.get(`/profile/${userId}`);
    return data.user;
  },

  /* ── Update profile fields ── */
  updateProfile: async (fields) => {
    set({ isSaving: true, error: null });
    try {
      const data = await api.patch('/profile/me', fields);
      set({ profile: data.user, isSaving: false });
      useAuthStore.getState().updateUser(data.user);
      return data.user;
    } catch (err) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  /* ── Upload avatar ── */
  uploadAvatar: async (file) => {
    set({ isSaving: true, error: null });
    try {
      const form = new FormData();
      form.append('avatar', file);
      const data = await api.upload('/profile/me/avatar', form);
      set((state) => ({ profile: { ...state.profile, avatar: data.avatarUrl }, isSaving: false }));
      useAuthStore.getState().updateUser({ avatar: data.avatarUrl });
      return data.avatarUrl;
    } catch (err) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  /* ── Remove avatar ── */
  removeAvatar: async () => {
    set({ isSaving: true });
    try {
      const data = await api.delete('/profile/me/avatar');
      set((state) => ({ profile: { ...state.profile, avatar: null }, isSaving: false }));
      useAuthStore.getState().updateUser({ avatar: null });
    } catch (err) {
      set({ error: err.message, isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
}));
