import express from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthMiddleware } from '../utils/authMiddleware.js';
import env from '../config/env.js';

const PAGE_SIZE = 30;

const MESSAGE_KINDS = new Set(['text', 'sign', 'sticker', 'voice', 'image']);

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

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

function shapeMessage(m) {
  return {
    id: m.id,
    text: m.text,
    kind: m.kind,
    sourceText: m.sourceText,
    status: m.status,
    metadata: m.metadata,
    createdAt: m.createdAt,
    senderId: m.senderId,
    chatId: m.chatId,
    senderName: m.sender?.name || 'User',
    senderAvatar: m.sender?.avatar || null,
    reactions: shapeReactionGroups(m.reactions || []),
    // Flatten sticker/sign metadata for easy consumption
    signs: m.metadata?.signs || [],
    segments: m.metadata?.segments || [],
    matchedWords: m.metadata?.matchedWords || [],
    missingWords: m.metadata?.missingWords || [],
  };
}

export function createChatRouter({ prisma, jwtSecret }) {
  const router = express.Router();
  const auth = createAuthMiddleware(jwtSecret);

  /* ── GET /api/chat ── list all chats */
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
          select: { id: true, text: true, kind: true, createdAt: true, senderId: true },
        },
      },
    });

    const chatIds = chats.map((c) => c.id);
    const unreadRows = chatIds.length
      ? await prisma.message.groupBy({
          by: ['chatId'],
          where: { chatId: { in: chatIds }, senderId: { not: myId }, status: { not: 'seen' } },
          _count: { id: true },
        })
      : [];
    const unreadMap = Object.fromEntries(unreadRows.map((r) => [r.chatId, r._count.id]));
    res.json({ chats: chats.map((c) => ({ ...c, unreadCount: unreadMap[c.id] ?? 0 })) });
  }));

  /* ── GET /api/chat/:chatId ── single chat info */
  router.get('/:chatId', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.chatId,
        OR: [{ isGlobal: true }, { participants: { some: { id: myId } } }],
      },
      include: {
        participants: { select: { id: true, name: true, avatar: true, isOnline: true } },
        _count: { select: { messages: true } },
      },
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ chat });
  }));

  /* ── GET /api/chat/:chatId/messages ── paginated messages */
  router.get('/:chatId/messages', auth, asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const myId  = req.auth.userId;
    const limit = Math.min(parseInt(req.query.limit) || PAGE_SIZE, 100);
    const before = req.query.before || null;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, OR: [{ isGlobal: true }, { participants: { some: { id: myId } } }] },
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const messages = await prisma.message.findMany({
      where: { chatId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, text: true, kind: true, sourceText: true,
        status: true, metadata: true, createdAt: true, senderId: true, chatId: true,
        sender: { select: { id: true, name: true, avatar: true } },
        reactions: {
          select: { id: true, emoji: true, userId: true, user: { select: { id: true, name: true } } },
        },
      },
    });

    const ordered = messages.reverse();
    res.json({
      messages: ordered.map(shapeMessage),
      hasMore:    messages.length === limit,
      nextCursor: messages.length === limit ? ordered[0].createdAt.toISOString() : null,
    });
  }));

  /* ── POST /api/chat/:chatId/messages ── REST send message (sticker/sign/text) */
  router.post('/:chatId/messages', auth, asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const myId = req.auth.userId;
    const { text, kind, sourceText, signs, segments, matchedWords, missingWords } = req.body ?? {};

    const resolvedKind = MESSAGE_KINDS.has(kind) ? kind : 'text';
    const resolvedText = String(text ?? '').trim();
    if (!resolvedText) return res.status(400).json({ message: 'text is required' });

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, OR: [{ isGlobal: true }, { participants: { some: { id: myId } } }] },
      select: { id: true, participants: { select: { id: true } } },
    });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const saved = await prisma.message.create({
      data: {
        text: resolvedText,
        kind: resolvedKind,
        sourceText: sourceText || null,
        status: 'sent',
        senderId: myId,
        chatId,
        metadata: {
          signs:        Array.isArray(signs) ? signs : [],
          segments:     Array.isArray(segments) ? segments : [],
          matchedWords: Array.isArray(matchedWords) ? matchedWords : [],
          missingWords: Array.isArray(missingWords) ? missingWords : [],
        },
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        reactions: { select: { id: true, emoji: true, userId: true, user: { select: { id: true, name: true } } } },
      },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    res.status(201).json({ message: shapeMessage(saved) });
  }));

  /* ── PATCH /api/chat/:chatId/seen ── */
  router.patch('/:chatId/seen', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    await prisma.message.updateMany({
      where: { chatId: req.params.chatId, senderId: { not: myId }, status: { not: 'seen' } },
      data:  { status: 'seen' },
    });
    res.json({ ok: true });
  }));

  /* ── POST /api/chat/private ── create / get 1-on-1 chat */
  router.post('/private', auth, asyncHandler(async (req, res) => {
    const { participantId, participantEmail } = req.body ?? {};
    const myId = req.auth.userId;

    let targetId = participantId;
    if (!targetId && participantEmail) {
      const found = await prisma.user.findUnique({
        where: { email: String(participantEmail).trim().toLowerCase() },
        select: { id: true },
      });
      if (!found) return res.status(404).json({ message: 'No user found with that email.' });
      targetId = found.id;
    }
    if (!targetId) return res.status(400).json({ message: 'participantId or participantEmail required.' });
    if (targetId === myId) return res.status(400).json({ message: 'Cannot chat with yourself.' });

    const participant = await prisma.user.findUnique({ where: { id: targetId } });
    if (!participant) return res.status(404).json({ message: 'Participant not found.' });

    const existingChats = await prisma.chat.findMany({
      where: { isGlobal: false, isGroup: false, participants: { some: { id: myId } } },
      include: { participants: { select: { id: true } } },
    });
    const existing = existingChats.find((c) => {
      const ids = c.participants.map((p) => p.id).sort();
      return ids.length === 2 && ids.includes(myId) && ids.includes(targetId);
    });
    if (existing) {
      const full = await prisma.chat.findUnique({
        where: { id: existing.id },
        include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
      });
      return res.json({ chat: full, existing: true });
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup: false, isGlobal: false, title: null,
        participants: { connect: [{ id: myId }, { id: targetId }] },
      },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
    });
    res.status(201).json({ chat, existing: false });
  }));

  /* ══ GROUP CHAT ══ */

  /* ── POST /api/chat/group ── create group */
  router.post('/group', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const { title, participantIds } = req.body ?? {};

    if (!title || !title.trim()) return res.status(400).json({ message: 'title is required' });
    const ids = Array.isArray(participantIds) ? participantIds.filter((id) => id !== myId) : [];
    if (ids.length < 1) return res.status(400).json({ message: 'At least one other participant is required' });

    // Verify all participants exist
    const found = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
    if (found.length !== ids.length) return res.status(400).json({ message: 'One or more participant IDs not found' });

    const allIds = [...new Set([myId, ...ids])];
    const chat = await prisma.chat.create({
      data: {
        title: title.trim(),
        isGroup: true,
        isGlobal: false,
        participants: { connect: allIds.map((id) => ({ id })) },
      },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
    });
    res.status(201).json({ chat });
  }));

  /* ── PATCH /api/chat/group/:chatId ── update group title */
  router.patch('/group/:chatId', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const { title } = req.body ?? {};

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.chatId, isGroup: true, participants: { some: { id: myId } } },
    });
    if (!chat) return res.status(404).json({ message: 'Group not found' });

    const updated = await prisma.chat.update({
      where: { id: req.params.chatId },
      data: { ...(title?.trim() ? { title: title.trim() } : {}) },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
    });
    res.json({ chat: updated });
  }));

  /* ── POST /api/chat/group/:chatId/members ── add member */
  router.post('/group/:chatId/members', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const { userId } = req.body ?? {};
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.chatId, isGroup: true, participants: { some: { id: myId } } },
    });
    if (!chat) return res.status(404).json({ message: 'Group not found' });

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ message: 'User not found' });

    const updated = await prisma.chat.update({
      where: { id: req.params.chatId },
      data: { participants: { connect: { id: userId } } },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
    });
    res.json({ chat: updated });
  }));

  /* ── DELETE /api/chat/group/:chatId/members/:userId ── remove member */
  router.delete('/group/:chatId/members/:userId', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const { chatId, userId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, isGroup: true, participants: { some: { id: myId } } },
    });
    if (!chat) return res.status(404).json({ message: 'Group not found' });

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { participants: { disconnect: { id: userId } } },
      include: { participants: { select: { id: true, name: true, avatar: true, isOnline: true } } },
    });
    res.json({ chat: updated });
  }));

  /* ── DELETE /api/chat/group/:chatId/leave ── leave group */
  router.delete('/group/:chatId/leave', auth, asyncHandler(async (req, res) => {
    const myId = req.auth.userId;
    const chat = await prisma.chat.findFirst({
      where: { id: req.params.chatId, isGroup: true, participants: { some: { id: myId } } },
    });
    if (!chat) return res.status(404).json({ message: 'Group not found' });

    await prisma.chat.update({
      where: { id: req.params.chatId },
      data: { participants: { disconnect: { id: myId } } },
    });
    res.json({ message: 'Left group successfully' });
  }));

  return router;
}
