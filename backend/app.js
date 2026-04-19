import express from 'express';
import cors from 'cors';
import { createAuthRouter } from './routes/authRoutes.js';
import { createChatRouter } from './routes/chatRoutes.js';
import { createDashboardRouter } from './routes/dashboardRoutes.js';
import { createProfileRouter } from './routes/profileRoutes.js';
import { createSignLanguageRouter } from './routes/signLanguageRoutes.js';
import { createSpeechToTextRouter } from './routes/speechToTextRoutes.js';
import { createTextToSignRouter } from './routes/textToSignRoutes.js';
import { createUserRouter } from './routes/userRoutes.js';

export function createApp({
  prisma,
  jwtSecret,
  signLanguageService,
  speechToTextService,
  speechToTextConfig,
  textToSignService
}) {
  const app = express();

  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', async (req, res) => {
    const speech = speechToTextService.getAvailabilityDetail();
    const [users, chats, messages] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count()
    ]);
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      totals: { users, chats, messages },
      realtimeSignLanguage: true,
      textToSignAvailable: true,
      speechToTextAvailable: speech.available,
      ...(speech.available ? {} : {
        speechToTextReason: speech.reason,
        speechToTextHint: speech.hint
      })
    });
  });

  app.use('/api/auth',           createAuthRouter({ prisma, jwtSecret }));
  app.use('/api/chat',           createChatRouter({ prisma, jwtSecret }));
  app.use('/api/dashboard',      createDashboardRouter({ prisma, jwtSecret }));
  app.use('/api/profile',        createProfileRouter({ prisma, jwtSecret }));
  app.use('/api/users',          createUserRouter({ prisma, jwtSecret }));
  app.use('/api/sign-language',  createSignLanguageRouter(signLanguageService));
  app.use('/api/text-to-sign',   createTextToSignRouter(textToSignService));
  app.use('/api/speech-to-text', createSpeechToTextRouter(speechToTextService, {
    maxFileSizeBytes: speechToTextConfig.maxFileSizeBytes
  }));

  app.use((error, req, res, next) => {
    console.error(error);
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Uploaded audio is too large. Keep recordings under 25 MB.' });
    }
    const statusCode =
      error.message === 'Sign language session not found' ? 404 : error.statusCode || 500;
    res.status(statusCode).json({
      message: statusCode === 500 ? 'Unexpected server error' : error.message
    });
  });

  return app;
}
