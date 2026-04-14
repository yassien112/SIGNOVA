import express from 'express';

export function createTextToSignRouter(textToSignService) {
  const router = express.Router();

  router.post('/', (req, res) => {
    const inputText = req.body?.text;

    if (typeof inputText !== 'string' || !inputText.trim()) {
      return res.status(400).json({
        message: 'Text is required.'
      });
    }

    const payload = textToSignService.translate(inputText);
    return res.json(payload);
  });

  return router;
}
