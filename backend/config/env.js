import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load backend/.env regardless of process.cwd() (fixes missing OPENAI_API_KEY when starting from repo root).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const backendEnvPath = path.join(backendRoot, '.env');

const envLoadResult = dotenv.config({ path: backendEnvPath });
if (envLoadResult.error) {
  if (envLoadResult.error.code === 'ENOENT') {
    console.warn(`[env] No file at ${backendEnvPath} — copy .env.example to .env and set OPENAI_API_KEY.`);
  } else {
    console.warn('[env] Could not load .env:', envLoadResult.error.message);
  }
}

function readNumber(name, fallback) {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readApiKey() {
  const raw = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY ?? '';
  const trimmed = String(raw).trim();
  return trimmed;
}

const env = Object.freeze({
  // Default 5000 so the Vite dev server can use 3000 without colliding (see frontend/vite.config.js).
  port: readNumber('PORT', 5000),
  jwtSecret: process.env.JWT_SECRET || 'signova-super-secret-key-2026',
  openAiApiKey: readApiKey(),
  signLanguage: Object.freeze({
    stabilizationWindowMs: readNumber('SL_STABILIZATION_WINDOW_MS', 750),
    commitHoldMs: readNumber('SL_COMMIT_HOLD_MS', 140),
    duplicateCooldownMs: readNumber('SL_DUPLICATE_COOLDOWN_MS', 850),
    phrasePauseMs: readNumber('SL_PHRASE_PAUSE_MS', 1600),
    minConfidence: readNumber('SL_MIN_CONFIDENCE', 0.55),
    minSupport: readNumber('SL_MIN_SUPPORT', 0.5),
    minOccurrences: readNumber('SL_MIN_OCCURRENCES', 3),
    maxBatchSize: readNumber('SL_MAX_BATCH_SIZE', 24),
    sessionTtlMs: readNumber('SL_SESSION_TTL_MS', 10 * 60 * 1000)
  }),
  speechToText: Object.freeze({
    model: process.env.OPENAI_SPEECH_MODEL || 'gpt-4o-mini-transcribe',
    maxFileSizeBytes: readNumber('OPENAI_SPEECH_MAX_FILE_BYTES', 25 * 1024 * 1024),
    requestTimeoutMs: readNumber('OPENAI_SPEECH_TIMEOUT_MS', 20 * 1000),
    defaultPrompt:
      process.env.OPENAI_SPEECH_PROMPT ||
      'Transcribe short chat messages accurately. Preserve Arabic and English words, names, and punctuation naturally.'
  })
});

export default env;
