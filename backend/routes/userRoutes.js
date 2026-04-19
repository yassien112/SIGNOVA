import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createUserRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  // GET /api/users — list all users except current user
  // Supports ?q=search query on name or email
  router.get(
    '/',
    auth,
    asyncHandler(async (req, res) => {
      const q = String(req.query.q ?? '').trim();
      const users = await prisma.user.findMany({
        where: {
          id: { not: req.auth.userId },
          ...(q ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          isOnline: true
        },
        orderBy: [
          { isOnline: 'desc' },
          { name: 'asc' }
        ],
        take: 50
      });
      res.json({ users });
    })
  );

  return router;
}
