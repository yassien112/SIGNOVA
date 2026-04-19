import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';

const PAGE_SIZE = 30;

function shapeReactionGroups(reactions = []) {
  const map = new Map();
  for (const reaction of reactions) {
    const key = reaction.emoji;
    if (!map.has(key)) map.set(key, { emoji: key, count: 0, users: [] });
    const g = map.get(key);
    g.count += 1;
    g.users.push({ userId: reaction.userId, name: reaction.user?.name || 'User' });
  }
  return Array.from(map.values());
}

export function createChatRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth   = createAuthMiddleware(jwtSecret);

  /* ── GET /api/chat ── */
  router.get('/', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;

    const chats = await prisma.chat.findMany({
      where: { OR: [{ isGlobal: true }, { participants: { some: { id: myId } } }] },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, isGroup: true, isGlobal: true,
        createdAt: true, updatedAt: true,
        participants: { select: { id: true, name: true, avatar: true, isOnline: true } },
        messages: {
          take: 1, orderBy: { createdAt: 'desc' },
          select: { id: true, text: true, kind: true, createdAt: true, senderId: true }
        }
      }
    });

    const chatIds   = chats.map((c) => c.id);
    const unreadRows = chatIds.length
      ? await prisma.message.groupBy({
          by: ['chatId'],
          where: { chatId: { in: chatIds }, senderId: { not: myId }, status: { not: 'seen' } },
          _count: { id: true }
        })
      : [];
    const unreadMap = Object.fromEntries(unreadRows.map((r) => [r.chatId, r._count.id]));
    res.json({ chats: chats.map((c) => ({ ...c, unreadCount: unreadMap[c.id] ?? 0 })) });
  }));

  /* ── GET /api/chat/:chatId/messages?before=<cursor>&limit=30 ── */
  router.get('/:chatId/messages', auth, asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const myId  = req.auth.userId;
    const limit = Math.min(parseInt(req.query.limit) || PAGE_SIZE, 100);
    const before = req.query.before || null;  // ISO timestamp cursor

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, OR: [{ isGlobal: true }, { participants: { some: { id: myId } } }] }
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {})
      },
      orderBy: { createdAt: 'desc' },  // newest first so we can paginate backwards
      take: limit,
      select: {
        id: true, text: true, kind: true, sourceText: true,
        status: true, metadata: true, createdAt: true, senderId: true,
        sender: { select: { id: true, name: true, avatar: true } },
        reactions: {
          select: {
            id: true, emoji: true, userId: true,
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Reverse so UI receives oldest-first order
    const ordered = messages.reverse();
    const shaped  = ordered.map((m) => ({
      ...m,
      senderName: m.sender?.name || 'User',
      reactions:  shapeReactionGroups(m.reactions),
      ...(m.metadata && typeof m.metadata === 'object' ? m.metadata : {}),
    }));

    res.json({
      messages: shaped,
      hasMore:  messages.length === limit,
      nextCursor: messages.length === limit ? ordered[0].createdAt.toISOString() : null,
    });
  }));

  /* ── PATCH /api/chat/:chatId/seen ── */
  router.patch('/:chatId/seen', auth, asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const myId = req.auth.userId;
    await prisma.message.updateMany({
      where: { chatId, senderId: { not: myId }, status: { not: 'seen' } },
      data:  { status: 'seen' }
    });
    res.json({ ok: true });
  }));

  /* ── POST /api/chat/private ── */
  router.post('/private', auth, asyncHandler(async (req, res) => {
    const { participantId, participantEmail } = req.body ?? {};
    const myId = req.auth.userId;

    let targetId = participantId;
    if (!targetId && participantEmail) {
      const found = await prisma.user.findUnique({
        where: { email: String(participantEmail).trim().toLowerCase() },
        select: { id: true }
      });
      if (!found) return res.status(404).json({ message: 'No user found with that email address.' });
      targetId = found.id;
    }
    if (!targetId)     return res.status(400).json({ message: 'participantId or participantEmail is required.' });
    if (targetId === myId) return res.status(400).json({ message: 'You cannot start a chat with yourself.' });

    const participant = await prisma.user.findUnique({ where: { id: targetId } });
    if (!participant) return res.status(404).json({ message: 'Participant not found.' });

    const existingChats = await prisma.chat.findMany({
      where: { isGlobal: false, isGroup: false, participants: { some: { id: myId } } },
      include: { participants: { select: { id: true } } }
    });
    const existing = existingChats.find((c) => {
      const ids = c.participants.map((p) => p.id).sort();
      return ids.length === 2 && ids.includes(myId) && ids.includes(targetId);
    });
    if (existing) {
      const full = await prisma.chat.findUnique({
        where: { id: existing.id },
        include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } }
      });
      return res.json({ chat: full, existing: true });
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup: false, isGlobal: false, title: null,
        participants: { connect: [{ id: myId }, { id: targetId }] }
      },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } }
    });
    res.status(201).json({ chat, existing: false });
  }));

  return router;
}
