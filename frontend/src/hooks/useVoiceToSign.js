import { TEXT_TO_SIGN_API_URL } from '../lib/config';
import { useSpeechRecognition } from './useSpeechRecognition';

export function useVoiceToSign({ language = 'ar-EG', onSignReady } = {}) {
  return useSpeechRecognition({
    language,
    onTranscript: async (spokenText) => {
      const response = await fetch(TEXT_TO_SIGN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
