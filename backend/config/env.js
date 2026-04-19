import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const backendEnvPath = path.join(backendRoot, '.env');

const envLoadResult = dotenv.config({ path: backendEnvPath });
if (envLoadResult.error) {
  if (envLoadResult.error.code === 'ENOENT') {
    console.warn(`[env] No file at ${backendEnvPath} — copy .env.example to .env and fill in values.`);
  } else {
    console.warn('[env] Could not load .env:', envLoadResult.error.message);
  }
}

function readNumber(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBool(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
}

function readApiKey() {
  const raw = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY ?? '';
  return String(raw).trim();
}

const env = Object.freeze({
  port: readNumber('PORT', 5000),
  jwtSecret: process.env.JWT_SECRET || 'signova-super-secret-key-2026',
  openAiApiKey: readApiKey(),

  auth: Object.freeze({
    accessTokenTtl:      process.env.AUTH_ACCESS_TOKEN_TTL      || '15m',
    refreshTokenTtlMs:   readNumber('AUTH_REFRESH_TOKEN_TTL_MS', 30 * 24 * 60 * 60 * 1000), // 30 days
    bcryptRounds:        readNumber('AUTH_BCRYPT_ROUNDS', 10),
  }),

  storage: Object.freeze({
    provider:   process.env.STORAGE_PROVIDER  || 'backblaze',   // backblaze | r2 | supabase
    baseUrl:    process.env.STORAGE_BASE_URL  || '',
    bucketName: process.env.STORAGE_BUCKET    || 'signova-signs',
    keyId:      process.env.STORAGE_KEY_ID    || '',
    appKey:     process.env.STORAGE_APP_KEY   || '',
    endpoint:   process.env.STORAGE_ENDPOINT  || '',
  }),

  signLanguage: Object.freeze({
    stabilizationWindowMs: readNumber('SL_STABILIZATION_WINDOW_MS', 750),
    commitHoldMs:          readNumber('SL_COMMIT_HOLD_MS', 140),
    duplicateCooldownMs:   readNumber('SL_DUPLICATE_COOLDOWN_MS', 850),
    phrasePauseMs:         readNumber('SL_PHRASE_PAUSE_MS', 1600),
    minConfidence:         readNumber('SL_MIN_CONFIDENCE', 0.55),
    minSupport:            readNumber('SL_MIN_SUPPORT', 0.5),
    minOccurrences:        readNumber('SL_MIN_OCCURRENCES', 3),
    maxBatchSize:          readNumber('SL_MAX_BATCH_SIZE', 24),
    sessionTtlMs:          readNumber('SL_SESSION_TTL_MS', 10 * 60 * 1000),
  }),

  speechToText: Object.freeze({
    model:            process.env.OPENAI_SPEECH_MODEL        || 'gpt-4o-mini-transcribe',
    maxFileSizeBytes: readNumber('OPENAI_SPEECH_MAX_FILE_BYTES', 25 * 1024 * 1024),
    requestTimeoutMs: readNumber('OPENAI_SPEECH_TIMEOUT_MS', 20_000),
    defaultPrompt:    process.env.OPENAI_SPEECH_PROMPT ||
      'Transcribe short chat messages accurately. Preserve Arabic and English words, names, and punctuation naturally.',
  }),

  notifications: Object.freeze({
    enabled:     readBool('NOTIFICATIONS_ENABLED', true),
    maxPerUser:  readNumber('NOTIFICATIONS_MAX_PER_USER', 200),
  }),
});

export default env;
