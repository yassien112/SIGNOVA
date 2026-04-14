import { resolveChatLanguage } from './languageUtils.js';

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeLanguage(language) {
  const normalized = String(language || '').trim().toLowerCase();
  return normalized || undefined;
}

export class SpeechToTextService {
  constructor({ client, config }) {
    this.client = client;
    this.config = config;
  }

  isAvailable() {
    return Boolean(this.client);
  }

  /** Safe for /api/health — never exposes the API key. */
  getAvailabilityDetail() {
    if (this.client) {
      return { available: true, reason: null };
    }
    return {
      available: false,
      reason: 'missing_or_empty_OPENAI_API_KEY',
      hint: 'Add OPENAI_API_KEY to backend/.env and restart the server.'
    };
  }

  async transcribeAudio({ buffer, filename, mimeType, language, prompt }) {
    if (!this.client) {
      throw createHttpError(
        'Speech-to-text service is not configured. Add OPENAI_API_KEY to the backend environment.',
        503
      );
    }

    if (!buffer?.length) {
      throw createHttpError('Audio upload is empty.', 400);
    }

    const audioFile = new File([buffer], filename || 'voice-note.webm', {
      type: mimeType || 'audio/webm'
    });

    const languageHint = normalizeLanguage(language);
    const promptText = String(prompt || '').trim() || this.config.defaultPrompt;

    try {
      // verbose_json includes detected language when the model performs auto language ID.
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: this.config.model,
        language: languageHint,
        prompt: promptText,
        response_format: 'verbose_json'
      });

      const text = String(transcription.text || '').trim();
      const apiLanguage = typeof transcription.language === 'string' ? transcription.language : '';

      return {
        text,
        language: resolveChatLanguage({
          apiLanguage,
          text,
          requestedLanguage: languageHint
        })
      };
    } catch (error) {
      const status = error?.status;
      const message = error?.message || String(error);
      const errType = error?.type || error?.code;
      console.error('[speech-to-text] OpenAI transcription failed:', {
        status,
        type: errType,
        message: message.slice(0, 500)
      });

      if (status === 401) {
        throw createHttpError('Speech-to-text authentication failed. Check OPENAI_API_KEY.', 502);
      }

      if (status === 400) {
        throw createHttpError(
          'Invalid or unsupported audio. Try a shorter clip or record again (WebM/Opus from the browser is supported).',
          400
        );
      }

      if (status === 429) {
        throw createHttpError('Speech transcription rate limited. Wait a moment and try again.', 429);
      }

      throw createHttpError(
        status >= 400 && status < 500
          ? `Speech transcription rejected (${status}). ${message}`
          : 'Speech transcription failed. Please try again.',
        status >= 400 && status < 600 ? status : 502
      );
    }
  }
}
