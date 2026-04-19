import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createChatRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  router.get(
    '/',
    auth,
    asyncHandler(async (req, res) => {
      const chats = await prisma.chat.findMany({
        where: {
          OR: [
            { isGlobal: true },
            { participants: { some: { id: req.auth.userId } } }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          isGroup: true,
          isGlobal: true,
          createdAt: true,
          updatedAt: true,
          participants: {
            select: { id: true, name: true, avatar: true, isOnline: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              text: true,
              kind: true,
              createdAt: true,
              senderId: true
            }
          }
        }
      });

      res.json({ chats });
    })
  );

  router.get(
    '/:chatId/messages',
    auth,
    asyncHandler(async (req, res) => {
      const { chatId } = req.params;

      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { isGlobal: true },
            { participants: { some: { id: req.auth.userId } } }
          ]
        }
      });

      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          text: true,
          kind: true,
          sourceText: true,
          status: true,
          metadata: true,
          createdAt: true,
          senderId: true,
          sender: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      res.json({ messages });
    })
  );

  router.post(
    '/private',
    auth,
    asyncHandler(async (req, res) => {
      const { participantId } = req.body ?? {};

      if (!participantId || participantId === req.auth.userId) {
        return res.status(400).json({ message: 'A valid second participant is required' });
      }

      const participant = await prisma.user.findUnique({ where: { id: participantId } });
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }

      const existingChats = await prisma.chat.findMany({
        where: {
          isGlobal: false,
          isGroup: false,
          participants: {
            some: { id: req.auth.userId }
          }
        },
        include: {
          participants: {
            select: { id: true }
          }
        }
      });

      const existing = existingChats.find((chat) => {
        const ids = chat.participants.map((p) => p.id).sort();
        return ids.length === 2 && ids[0] !== ids[1] && ids.includes(req.auth.userId) && ids.includes(participantId);
      });

      if (existing) {
        return res.json({ chat: existing, existing: true });
      }

      const chat = await prisma.chat.create({
        data: {
          isGroup: false,
          isGlobal: false,
          title: null,
          participants: {
            connect: [{ id: req.auth.userId }, { id: participantId }]
          }
        },
        include: {
          participants: {
            select: { id: true, name: true, avatar: true, isOnline: true }
          }
        }
      });

      res.status(201).json({ chat, existing: false });
    })
  );

  return router;
}
