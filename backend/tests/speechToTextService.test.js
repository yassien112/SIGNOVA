import test from 'node:test';
import assert from 'node:assert/strict';
import { SpeechToTextService } from '../services/speech-to-text/SpeechToTextService.js';

const config = {
  model: 'gpt-4o-mini-transcribe',
  defaultPrompt: 'Preserve Arabic and English naturally.'
};

test('transcribeAudio returns trimmed text, language, and uses verbose_json', async () => {
  let receivedPayload = null;

  const service = new SpeechToTextService({
    client: {
      audio: {
        transcriptions: {
          create: async (payload) => {
            receivedPayload = payload;
            return { text: '  hello world  ', language: 'english' };
          }
        }
      }
    },
    config
  });

  const result = await service.transcribeAudio({
    buffer: Buffer.from('demo-audio'),
    filename: 'voice.webm',
    mimeType: 'audio/webm',
    language: 'en'
  });

  assert.equal(result.text, 'hello world');
  assert.equal(result.language, 'en');
  assert.equal(receivedPayload.model, config.model);
  assert.equal(receivedPayload.language, 'en');
  assert.equal(receivedPayload.prompt, config.defaultPrompt);
  assert.equal(receivedPayload.response_format, 'verbose_json');
});

test('getAvailabilityDetail reports missing client', () => {
  const missing = new SpeechToTextService({ client: null, config }).getAvailabilityDetail();
  assert.equal(missing.available, false);
  assert.equal(missing.reason, 'missing_or_empty_OPENAI_API_KEY');

  const ok = new SpeechToTextService({
    client: { audio: { transcriptions: { create: async () => ({}) } } },
    config
  }).getAvailabilityDetail();
  assert.equal(ok.available, true);
  assert.equal(ok.reason, null);
});

test('transcribeAudio surfaces a helpful error when the API key is missing', async () => {
  const service = new SpeechToTextService({
    client: null,
    config
  });

  await assert.rejects(
    () =>
      service.transcribeAudio({
        buffer: Buffer.from('demo-audio')
      }),
    (error) => {
      assert.equal(error.statusCode, 503);
      assert.match(error.message, /OPENAI_API_KEY/);
      return true;
    }
  );
});
