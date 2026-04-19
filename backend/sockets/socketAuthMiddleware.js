import jwt from 'jsonwebtoken';

/**
 * Socket.IO middleware — verifies JWT passed in socket.handshake.auth.token
 * Attaches userId to socket.data.userId on success.
 */
export function createSocketAuthMiddleware(jwtSecret) {
  return function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated for now (graceful degradation)
      // Change to: return next(new Error('Unauthorized')); to enforce auth
      return next();
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      socket.data.userId = payload.userId;
      next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  };
}
