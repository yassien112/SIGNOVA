import OpenAI from 'openai';
import env from '../config/env.js';

if (!env.openAiApiKey) {
  console.warn(
    '[speech-to-text] OPENAI_API_KEY is missing or empty in backend/.env. Set it to enable Voice to Write; /api/health will show speechToTextAvailable: false until then.'
  );
} else {
  console.log(
    `[speech-to-text] OpenAI client initialized (transcription model: ${env.speechToText.model}).`
  );
}

const openai = env.openAiApiKey
  ? new OpenAI({
      apiKey: env.openAiApiKey,
      timeout: env.speechToText.requestTimeoutMs
    })
  : null;

export default openai;
