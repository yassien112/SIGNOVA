import crypto from 'node:crypto';
import { SignLanguageSession } from './SignLanguageSession.js';

function sanitizePredictions(predictions, maxBatchSize) {
  const normalizedPredictions = Array.isArray(predictions) ? predictions : [predictions];

  return normalizedPredictions
    .filter(Boolean)
    .slice(0, maxBatchSize)
    .map((prediction) => ({
      label: prediction.label,
      score: prediction.score,
      timestamp: prediction.timestamp
    }));
}

export class SignLanguageService {
  constructor(config) {
    this.config = config;
    this.sessions = new Map();

    const interval = setInterval(() => {
      this.pruneExpiredSessions();
    }, 60 * 1000);

    interval.unref?.();
  }

  createSession(metadata = {}) {
    const sessionId = crypto.randomUUID();
    const session = new SignLanguageSession({
      sessionId,
      config: this.config,
      metadata
    });

    this.sessions.set(sessionId, session);
    return session.getSnapshot();
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Sign language session not found');
    }

    session.lastActivityAt = Date.now();
    return session;
  }

  processPredictions(sessionId, predictions) {
    const session = this.getSession(sessionId);
    const sanitizedPredictions = sanitizePredictions(predictions, this.config.maxBatchSize);

    if (sanitizedPredictions.length === 0) {
      return session.getSnapshot();
    }

    return session.ingestPredictions(sanitizedPredictions);
  }

  resetSession(sessionId) {
    return this.getSession(sessionId).reset();
  }

  closeSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getConfig() {
    return {
      transport: 'socket.io',
      fallbackTransport: 'rest',
      modelStrategy: 'edge-mediapipe-streaming',
      tuning: this.config
    };
  }

  pruneExpiredSessions() {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > this.config.sessionTtlMs) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
