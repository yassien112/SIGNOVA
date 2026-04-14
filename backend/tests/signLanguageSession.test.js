import test from 'node:test';
import assert from 'node:assert/strict';
import { SignLanguageSession } from '../services/sign-language/SignLanguageSession.js';

const config = {
  stabilizationWindowMs: 500,
  commitHoldMs: 100,
  duplicateCooldownMs: 600,
  phrasePauseMs: 1000,
  minConfidence: 0.5,
  minSupport: 0.5,
  minOccurrences: 3
};

function sample(label, score, timestamp) {
  return { label, score, timestamp };
}

test('commits a stable gesture into continuous text', () => {
  const session = new SignLanguageSession({ sessionId: 'session-1', config });
  const baseTimestamp = Date.now();

  session.ingestPrediction(sample('Hello', 0.9, baseTimestamp));
  session.ingestPrediction(sample('Hello', 0.92, baseTimestamp + 40));
  const snapshot = session.ingestPrediction(sample('Hello', 0.95, baseTimestamp + 140));

  assert.equal(snapshot.committedText, 'Hello');
  assert.equal(snapshot.displayText, 'Hello');
  assert.equal(snapshot.isStable, true);
});

test('suppresses duplicate commits within the cooldown window', () => {
  const session = new SignLanguageSession({ sessionId: 'session-2', config });
  const baseTimestamp = Date.now();

  session.ingestPrediction(sample('Peace', 0.85, baseTimestamp));
  session.ingestPrediction(sample('Peace', 0.88, baseTimestamp + 40));
  session.ingestPrediction(sample('Peace', 0.9, baseTimestamp + 140));

  session.ingestPrediction(sample('Peace', 0.91, baseTimestamp + 180));
  session.ingestPrediction(sample('Peace', 0.93, baseTimestamp + 220));
  const snapshot = session.ingestPrediction(sample('Peace', 0.95, baseTimestamp + 280));

  assert.equal(snapshot.committedText, 'Peace');
});

test('creates sentence boundaries after a pause and capitalizes the next token', () => {
  const session = new SignLanguageSession({ sessionId: 'session-3', config });
  const baseTimestamp = Date.now();

  session.ingestPrediction(sample('hello', 0.9, baseTimestamp));
  session.ingestPrediction(sample('hello', 0.91, baseTimestamp + 40));
  session.ingestPrediction(sample('hello', 0.94, baseTimestamp + 140));

  session.ingestPrediction(sample(null, 0, baseTimestamp + 1400));
  session.ingestPrediction(sample('look', 0.88, baseTimestamp + 1450));
  session.ingestPrediction(sample('look', 0.9, baseTimestamp + 1490));
  const snapshot = session.ingestPrediction(sample('look', 0.92, baseTimestamp + 1600));

  assert.equal(snapshot.committedText, 'Hello. Look');
});
