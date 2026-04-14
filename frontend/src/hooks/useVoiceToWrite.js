import { useSpeechRecognition } from './useSpeechRecognition';

export function useVoiceToWrite({ language = 'ar-EG', onTranscription } = {}) {
  return useSpeechRecognition({
    language,
    onTranscript: async (transcribedText) => {
      onTranscription?.(transcribedText);
    }
  });
}
