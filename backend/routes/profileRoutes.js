import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createProfileRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  router.get(
    '/me',
    auth,
    asyncHandler(async (req, res) => {
      const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          preferredLang: true,
          isOnline: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              messages: true,
              chats: true,
              notifications: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user });
    })
  );

  router.patch(
    '/me',
    auth,
    asyncHandler(async (req, res) => {
      const { name, avatar, bio, preferredLang } = req.body ?? {};
      const updatedUser = await prisma.user.update({
        where: { id: req.auth.userId },
        data: {
          ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
          ...(typeof avatar === 'string' ? { avatar: avatar.trim() || null } : {}),
          ...(typeof bio === 'string' ? { bio: bio.trim() || null } : {}),
          ...(typeof preferredLang === 'string' && preferredLang.trim()
            ? { preferredLang: preferredLang.trim().toLowerCase() }
            : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          preferredLang: true,
          isOnline: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({ user: updatedUser });
    })
  );

  return router;
}
