import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';
import env from '../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.speechToText.maxFileSizeBytes },
});

function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F]/g, '')  // remove tashkeel
    .replace(/\u0622|\u0623|\u0625/g, '\u0627')  // normalize alef
    .replace(/\u0629/g, '\u0647')     // ta marbuta → ha
    .replace(/\u064A|\u0649/g, '\u064A') // ya forms
    .trim()
    .toLowerCase();
}

function tokenize(text) {
  return text
    .replace(/[.,!?;:\-_()"']/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

async function textToSigns(prisma, text, lang) {
  const words = tokenize(text);
  const matched = [];
  const missing = [];

  for (const word of words) {
    const normalized = lang === 'ar' ? normalizeArabic(word) : word.toLowerCase();
    const sign = await prisma.sign.findFirst({
      where: {
        isActive: true,
        lang: lang,
        OR: [
          { normalizedWord: normalized },
          { normalizedWord: { contains: normalized } },
          { aliases: { has: normalized } },
          { tags: { has: normalized } },
        ],
      },
      include: { pack: { select: { id: true, name: true, slug: true } } },
    });

    if (sign) {
      matched.push({
        word,
        sign: {
          id: sign.id, word: sign.word, label: sign.label,
          imageUrl: sign.imageUrl, thumbUrl: sign.thumbUrl,
          lang: sign.lang, category: sign.category,
          pack: sign.pack,
        },
      });
    } else {
      missing.push(word);
    }
  }

  return { words, matched, missing };
}

export function createSpeechRouter({ prisma, jwtSecret, speechToTextService }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  /* ── POST /api/speech/transcribe ── */
  router.post('/transcribe', auth, upload.single('audio'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No audio file uploaded. Send as multipart field "audio".' });

    const lang = String(req.body?.lang || req.query.lang || '').trim() || undefined;
    const prompt = String(req.body?.prompt || '').trim() || undefined;

    const result = await speechToTextService.transcribeAudio({
      buffer:   req.file.buffer,
      filename: req.file.originalname || 'audio.webm',
      mimeType: req.file.mimetype,
      language: lang,
      prompt,
    });

    res.json({
      transcript: result.text,
      lang:       result.language,
      words:      tokenize(result.text),
    });
  }));

  /* ── POST /api/speech/text-to-signs ── */
  router.post('/text-to-signs', auth, asyncHandler(async (req, res) => {
    const text = String(req.body?.text || '').trim();
    const lang = String(req.body?.lang || 'ar').trim();

    if (!text) return res.status(400).json({ message: 'text is required' });

    const result = await textToSigns(prisma, text, lang);
    res.json(result);
  }));

  /* ── POST /api/speech/full-pipeline ── audio → transcript → signs ── */
  router.post('/full-pipeline', auth, upload.single('audio'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No audio file. Send as multipart field "audio".' });

    const langHint = String(req.body?.lang || req.query.lang || '').trim() || undefined;

    // Step 1: transcribe
    const transcription = await speechToTextService.transcribeAudio({
      buffer:   req.file.buffer,
      filename: req.file.originalname || 'audio.webm',
      mimeType: req.file.mimetype,
      language: langHint,
    });

    const detectedLang = transcription.language || langHint || 'ar';
    const transcript   = transcription.text;

    // Step 2: map words to signs
    const signsResult = await textToSigns(prisma, transcript, detectedLang);

    res.json({
      transcript,
      detectedLang,
      words:   signsResult.words,
      matched: signsResult.matched,
      missing: signsResult.missing,
      matchRate: signsResult.words.length
        ? Math.round((signsResult.matched.length / signsResult.words.length) * 100)
        : 0,
    });
  }));

  return router;
}
