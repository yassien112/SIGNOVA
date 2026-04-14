import express from 'express';
import cors from 'cors';
import { createAuthRouter } from './routes/authRoutes.js';
import { createSignLanguageRouter } from './routes/signLanguageRoutes.js';
import { createSpeechToTextRouter } from './routes/speechToTextRoutes.js';
import { createTextToSignRouter } from './routes/textToSignRoutes.js';

export function createApp({
  prisma,
  jwtSecret,
  signLanguageService,
  speechToTextService,
  speechToTextConfig,
  textToSignService
}) {
  const app = express();

  // Reflect request Origin so browsers on http(s)://<LAN-IP>:PORT are accepted (mobile + desktop).
  app.use(
    cors({
      origin: true,
      credentials: false
    })
  );
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (req, res) => {
    const speech = speechToTextService.getAvailabilityDetail();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      realtimeSignLanguage: true,
      textToSignAvailable: true,
      speechToTextAvailable: speech.available,
      ...(speech.available
        ? {}
        : {
            speechToTextReason: speech.reason,
            speechToTextHint: speech.hint
          })
    });
  });

  app.use('/api/auth', createAuthRouter({ prisma, jwtSecret }));
  app.use('/api/sign-language', createSignLanguageRouter(signLanguageService));
  app.use('/api/text-to-sign', createTextToSignRouter(textToSignService));
  app.use(
    '/api/speech-to-text',
    createSpeechToTextRouter(speechToTextService, {
      maxFileSizeBytes: speechToTextConfig.maxFileSizeBytes
    })
  );

  app.use((error, req, res, next) => {
    console.error(error);
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: 'Uploaded audio is too large. Keep recordings under 25 MB.'
      });
    }

    const statusCode =
      error.message === 'Sign language session not found' ? 404 : error.statusCode || 500;

    res.status(statusCode).json({
      message:
        statusCode === 500 ? 'Unexpected server error' : error.message
    });
  });

  return app;
}
