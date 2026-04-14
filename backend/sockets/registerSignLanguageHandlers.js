function emitAcknowledge(acknowledge, payload) {
  if (typeof acknowledge === 'function') {
    acknowledge(payload);
  }
}

export function registerSignLanguageHandlers(io, signLanguageService) {
  const namespace = io.of('/sign-language');

  namespace.on('connection', (socket) => {
    socket.on('sign:session:start', (payload = {}, acknowledge) => {
      try {
        const snapshot = signLanguageService.createSession({
          userId: payload.userId ?? null,
          source: payload.source ?? 'camera'
        });

        socket.data.signLanguageSessionId = snapshot.sessionId;
        emitAcknowledge(acknowledge, { ok: true, snapshot });
        socket.emit('sign:translation:update', snapshot);
      } catch (error) {
        emitAcknowledge(acknowledge, { ok: false, message: error.message });
      }
    });

    socket.on('sign:frame', (payload = {}, acknowledge) => {
      try {
        const sessionId = payload.sessionId ?? socket.data.signLanguageSessionId;

        if (!sessionId) {
          throw new Error('Missing sign language session');
        }

        const predictions = payload.predictions ?? payload.prediction ?? payload;
        const snapshot = signLanguageService.processPredictions(sessionId, predictions);

        emitAcknowledge(acknowledge, { ok: true, snapshot });
        socket.emit('sign:translation:update', snapshot);
      } catch (error) {
        emitAcknowledge(acknowledge, { ok: false, message: error.message });
      }
    });

    socket.on('sign:reset', (payload = {}, acknowledge) => {
      try {
        const sessionId = payload.sessionId ?? socket.data.signLanguageSessionId;

        if (!sessionId) {
          throw new Error('Missing sign language session');
        }

        const snapshot = signLanguageService.resetSession(sessionId);
        emitAcknowledge(acknowledge, { ok: true, snapshot });
        socket.emit('sign:translation:update', snapshot);
      } catch (error) {
        emitAcknowledge(acknowledge, { ok: false, message: error.message });
      }
    });

    socket.on('sign:session:stop', (payload = {}, acknowledge) => {
      const sessionId = payload.sessionId ?? socket.data.signLanguageSessionId;

      if (sessionId) {
        signLanguageService.closeSession(sessionId);
      }

      socket.data.signLanguageSessionId = null;
      emitAcknowledge(acknowledge, { ok: true });
    });

    socket.on('disconnect', () => {
      if (!socket.data.signLanguageSessionId) {
        return;
      }

      signLanguageService.closeSession(socket.data.signLanguageSessionId);
    });
  });
}
