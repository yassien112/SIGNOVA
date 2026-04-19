import { TEXT_TO_SIGN_API_URL } from '../lib/config';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useAuthStore } from '../store/authStore';

export function useVoiceToSign({ language = 'ar-EG', onSignReady } = {}) {
  const { token } = useAuthStore();

  return useSpeechRecognition({
    language,
    onTranscript: async (spokenText) => {
      const response = await fetch(TEXT_TO_SIGN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: spokenText })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || 'Could not convert the spoken text into signs.');
      }

      onSignReady?.({
        ...payload,
        sourceText: spokenText
      });
    }
  });
}
