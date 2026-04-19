import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

export function createChatRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  // GET /api/chat — list all chats for current user (global + private)
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
            select: { id: true, text: true, kind: true, createdAt: true, senderId: true }
          }
        }
      });
      res.json({ chats });
    })
  );

  // GET /api/chat/:chatId/messages
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
          sender: { select: { id: true, name: true, avatar: true } }
        }
      });

      res.json({ messages });
    })
  );

  // POST /api/chat/private — create or return existing private chat
  // Accepts either { participantId } or { participantEmail }
  router.post(
    '/private',
    auth,
    asyncHandler(async (req, res) => {
      const { participantId, participantEmail } = req.body ?? {};

      // Resolve participant by email if id not provided
      let targetId = participantId;
      if (!targetId && participantEmail) {
        const found = await prisma.user.findUnique({
          where: { email: String(participantEmail).trim().toLowerCase() },
          select: { id: true }
        });
        if (!found) {
          return res.status(404).json({ message: 'No user found with that email address.' });
        }
        targetId = found.id;
      }

      if (!targetId) {
        return res.status(400).json({ message: 'participantId or participantEmail is required.' });
      }

      if (targetId === req.auth.userId) {
        return res.status(400).json({ message: 'You cannot start a chat with yourself.' });
      }

      // Check participant exists
      const participant = await prisma.user.findUnique({ where: { id: targetId } });
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found.' });
      }

      // Find existing private 1-on-1 chat between the two users
      const existingChats = await prisma.chat.findMany({
        where: {
          isGlobal: false,
          isGroup: false,
          participants: { some: { id: req.auth.userId } }
        },
        include: { participants: { select: { id: true } } }
      });

      const existing = existingChats.find((c) => {
        const ids = c.participants.map((p) => p.id).sort();
        return (
          ids.length === 2 &&
          ids.includes(req.auth.userId) &&
          ids.includes(targetId)
        );
      });

      if (existing) {
        // Re-fetch with full participant info
        const full = await prisma.chat.findUnique({
          where: { id: existing.id },
          include: {
            participants: { select: { id: true, name: true, avatar: true, isOnline: true } }
          }
        });
        return res.json({ chat: full, existing: true });
      }

      // Create new private chat
      const chat = await prisma.chat.create({
        data: {
          isGroup: false,
          isGlobal: false,
          title: null,
          participants: {
            connect: [{ id: req.auth.userId }, { id: targetId }]
          }
        },
        include: {
          participants: { select: { id: true, name: true, avatar: true, isOnline: true } }
        }
      });

      res.status(201).json({ chat, existing: false });
    })
  );

  return router;
}
