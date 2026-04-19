import jwt from 'jsonwebtoken';

export function createAuthMiddleware(jwtSecret) {
  return function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.auth = {
        userId: payload.userId
      };
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
