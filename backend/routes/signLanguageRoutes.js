import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createSignLanguageRouter(signLanguageService) {
  const router = express.Router();

  router.get('/config', (req, res) => {
    res.json(signLanguageService.getConfig());
  });

  router.post('/session', (req, res) => {
    const snapshot = signLanguageService.createSession(req.body ?? {});
    res.status(201).json(snapshot);
  });

  router.post(
    '/session/:sessionId/predictions',
    asyncHandler(async (req, res) => {
      const predictions = req.body?.predictions ?? req.body?.prediction ?? req.body;
      const snapshot = signLanguageService.processPredictions(req.params.sessionId, predictions);
      res.json(snapshot);
    })
  );

  router.post('/session/:sessionId/reset', (req, res) => {
    const snapshot = signLanguageService.resetSession(req.params.sessionId);
    res.json(snapshot);
  });

  router.delete('/session/:sessionId', (req, res) => {
    signLanguageService.closeSession(req.params.sessionId);
    res.status(204).send();
  });

  return router;
}
