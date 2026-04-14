import test from 'node:test';
import assert from 'node:assert/strict';
import { TextToSignService } from '../services/text-to-sign/TextToSignService.js';

test('translate maps supported words and phrases into sign assets', () => {
  const service = new TextToSignService();

  const result = service.translate('Hello, thank you and go');

  assert.equal(result.text, 'hello thank you and go');
  assert.deepEqual(result.signs, [
    '/signs/hello.svg',
    '/signs/thank-you.svg',
    '/signs/go.svg'
  ]);
  assert.deepEqual(result.matchedWords, ['HELLO', 'THANK YOU', 'GO']);
  assert.deepEqual(result.missingWords, []);
});

test('translate returns cached values for repeated inputs', () => {
  const service = new TextToSignService();

  const first = service.translate('help stop');
  const second = service.translate('help stop');

  assert.equal(first, second);
  assert.deepEqual(first.signs, ['/signs/help.svg', '/signs/stop.svg']);
});

test('translate ignores unsupported words while keeping known signs', () => {
  const service = new TextToSignService();

  const result = service.translate('please come drink now');

  assert.equal(result.simplifiedText, 'come drink');
  assert.deepEqual(result.signs, ['/signs/come.svg', '/signs/drink.svg']);
  assert.deepEqual(result.missingWords, []);
});

test('translate supports Arabic aliases for the predefined sign list', () => {
  const service = new TextToSignService();

  const result = service.translate('مرحبا شكرا اذهب');

  assert.deepEqual(result.signs, [
    '/signs/hello.svg',
    '/signs/thank-you.svg',
    '/signs/go.svg'
  ]);
  assert.deepEqual(result.matchedWords, ['HELLO', 'THANK YOU', 'GO']);
});

test('translate prefers full phrases before falling back to individual words', () => {
  const service = new TextToSignService();

  const result = service.translate('go to school now');

  assert.deepEqual(result.signs, ['/signs/go-to-school.svg']);
  assert.deepEqual(result.matchedWords, ['GO TO SCHOOL']);
  assert.deepEqual(result.missingWords, []);
});

test('translate handles conversational phrase mapping for natural sign output', () => {
  const service = new TextToSignService();

  const result = service.translate('How are you today');

  assert.deepEqual(result.signs, ['/signs/how-are-you.svg']);
  assert.deepEqual(result.matchedWords, ['HOW ARE YOU']);
  assert.deepEqual(result.missingWords, []);
});

test('translate still falls back to individual words when no full phrase matches', () => {
  const service = new TextToSignService();

  const result = service.translate('hello school');

  assert.deepEqual(result.signs, ['/signs/hello.svg', '/signs/school.svg']);
  assert.deepEqual(result.matchedWords, ['HELLO', 'SCHOOL']);
});
