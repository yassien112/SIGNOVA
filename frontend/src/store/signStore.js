import { create } from 'zustand';
import { api } from '../lib/api';

export const useSignStore = create((set, get) => ({
  packs:       [],
  signs:       {},      // { [packSlug]: Sign[] }
  searchResults: [],
  isLoading:   false,
  isSearching: false,
  error:       null,

  /* ── Fetch all packs ── */
  fetchPacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/sign-language/packs');
      set({ packs: data.packs || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /* ── Fetch signs for a pack ── */
  fetchSignsByPack: async (packSlug, { page = 1, limit = 50 } = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ packSlug, page, limit });
      const data = await api.get(`/sign-language?${params}`);
      set((state) => ({
        signs: { ...state.signs, [packSlug]: data.signs || [] },
        isLoading: false,
      }));
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /* ── Fetch stickers only ── */
  fetchStickers: async (lang = 'ar') => {
    set({ isLoading: true });
    try {
      const data = await api.get(`/sign-language?onlyStickers=true&lang=${lang}`);
      set((state) => ({
        signs: { ...state.signs, [`stickers_${lang}`]: data.signs || [] },
        isLoading: false,
      }));
      return data.signs || [];
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  /* ── Search signs ── */
  searchSigns: async (query, lang) => {
    if (!query.trim()) { set({ searchResults: [] }); return []; }
    set({ isSearching: true });
    try {
      const params = new URLSearchParams({ q: query });
      if (lang) params.set('lang', lang);
      const data = await api.get(`/sign-language/search?${params}`);
      set({ searchResults: data.signs || [], isSearching: false });
      return data.signs || [];
    } catch (err) {
      set({ error: err.message, isSearching: false });
      return [];
    }
  },

  clearSearch: () => set({ searchResults: [] }),
  clearError:  () => set({ error: null }),
}));
