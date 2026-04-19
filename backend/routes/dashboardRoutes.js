import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createDashboardRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  router.get(
    '/stats',
    auth,
    asyncHandler(async (req, res) => {
      const [
        totalChats,
        totalMessages,
        onlineUsers,
        myMessages,
        myChats,
        latestChats,
        latestMessages
      ] = await Promise.all([
        prisma.chat.count(),
        prisma.message.count(),
        prisma.user.count({ where: { isOnline: true } }),
        prisma.message.count({ where: { senderId: req.auth.userId } }),
        prisma.chat.count({ where: { participants: { some: { id: req.auth.userId } } } }),
        prisma.chat.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            isGroup: true,
            isGlobal: true,
            updatedAt: true,
            participants: {
              select: { id: true, name: true, avatar: true, isOnline: true }
            }
          }
        }),
        prisma.message.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            text: true,
            kind: true,
            status: true,
            createdAt: true,
            chatId: true,
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        })
      ]);

      res.json({
        totals: {
          totalChats,
          totalMessages,
          onlineUsers,
          myMessages,
          myChats
        },
        latestChats,
        latestMessages
      });
    })
  );

  return router;
}
