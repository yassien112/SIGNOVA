import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createSpeechToTextRouter(speechToTextService, { maxFileSizeBytes }) {
  const router = express.Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeBytes
    }
  });

  router.post(
    '/',
    upload.single('audio'),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        console.warn('[speech-to-text] Rejected request: no audio file (use multipart field name "audio").');
        return res.status(400).json({ message: 'Audio file is required (multipart field: audio).' });
      }

      console.log('[speech-to-text] Transcribing upload:', {
        bytes: req.file.buffer?.length,
        mime: req.file.mimetype,
        name: req.file.originalname
      });

      const transcription = await speechToTextService.transcribeAudio({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        language: req.body?.language,
        prompt: req.body?.prompt
      });

      console.log('[speech-to-text] OK:', {
        language: transcription.language,
        textLength: transcription.text?.length ?? 0
      });

      return res.json({
        text: transcription.text,
        language: transcription.language
      });
    })
  );

  return router;
}
