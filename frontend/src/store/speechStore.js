import { create } from 'zustand';
import { api } from '../lib/api';

export const useSpeechStore = create((set) => ({
  transcript:   '',
  detectedLang: '',
  matched:      [],
  missing:      [],
  matchRate:    0,
  isProcessing: false,
  error:        null,

  /* ── Full pipeline: audio blob → transcript → signs ── */
  processAudio: async (audioBlob, langHint = '') => {
    set({ isProcessing: true, error: null, transcript: '', matched: [], missing: [] });
    try {
      const form = new FormData();
      form.append('audio', audioBlob, 'voice.webm');
      if (langHint) form.append('lang', langHint);

      const data = await api.upload('/speech/full-pipeline', form);
      set({
        transcript:   data.transcript   || '',
        detectedLang: data.detectedLang || '',
        matched:      data.matched      || [],
        missing:      data.missing      || [],
        matchRate:    data.matchRate    || 0,
        isProcessing: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isProcessing: false });
      throw err;
    }
  },

  /* ── Text only → signs ── */
  textToSigns: async (text, lang = 'ar') => {
    set({ isProcessing: true, error: null });
    try {
      const data = await api.post('/speech/text-to-signs', { text, lang });
      set({
        matched:      data.matched  || [],
        missing:      data.missing  || [],
        isProcessing: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message, isProcessing: false });
      throw err;
    }
  },

  reset: () => set({ transcript: '', detectedLang: '', matched: [], missing: [], matchRate: 0, error: null }),
  clearError: () => set({ error: null }),
}));
