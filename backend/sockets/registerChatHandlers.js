import { createSocketAuthMiddleware } from './socketAuthMiddleware.js';

function normalizeChatRoom(chatId) {
  return `chat:${chatId}`;
}

const typingTimers = new Map();
const ALLOWED_REACTIONS = new Set(['👍', '❤️', '😂', '😮', '😢', '🔥']);

function shapeReactionGroups(reactions = []) {
  const map = new Map();
  for (const reaction of reactions) {
    const key = reaction.emoji;
    if (!map.has(key)) map.set(key, { emoji: key, count: 0, users: [] });
    const group = map.get(key);
    group.count += 1;
    group.users.push({ userId: reaction.userId, name: reaction.user?.name || 'User' });
  }
  return Array.from(map.values());
}

export function registerChatHandlers(io, prisma, jwtSecret) {
  const chatNs = io.of('/chat');

  if (jwtSecret) chatNs.use(createSocketAuthMiddleware(jwtSecret));

  chatNs.on('connection', (socket) => {
    console.log('Chat user connected:', socket.id, '| userId:', socket.data.userId ?? 'guest');

    socket.on('register', async (userId) => {
      const uid = socket.data.userId || userId;
      if (!uid) return;
      socket.data.userId = uid;
      try {
        await prisma.user.update({ where: { id: uid }, data: { isOnline: true } });
        chatNs.emit('user_status', { userId: uid, isOnline: true });
      } catch (e) {
        console.error('presence update error:', e);
      }
    });

    socket.on('join_chat', async (chatId) => {
      if (!chatId) return;
      const userId = socket.data.userId;

      if (userId) {
        try {
          const chat = await prisma.chat.findFirst({
            where: {
              id: chatId,
              OR: [{ isGlobal: true }, { participants: { some: { id: userId } } }]
            },
            select: { id: true }
          });
          if (!chat) {
            socket.emit('error', { message: 'Chat not found or access denied' });
            return;
          }
        } catch (err) {
          console.error('join_chat DB error:', err);
        }
      }

      const currentRooms = [...socket.rooms].filter((r) => r.startsWith('chat:'));
      currentRooms.forEach((r) => socket.leave(r));
      socket.join(normalizeChatRoom(chatId));
    });

    socket.on('send_message', async (data) => {
      try {
        const senderId = socket.data.userId || data?.senderId;
        const chatId   = data?.chatId;
        const text     = String(data?.text ?? '').trim();
        if (!senderId || !chatId || !text) return;

        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            OR: [{ isGlobal: true }, { participants: { some: { id: senderId } } }]
          },
          select: { id: true, participants: { select: { id: true } } }
        });
        if (!chat) return;

        const savedMessage = await prisma.message.create({
          data: {
            text,
            kind: data?.kind || 'text',
            sourceText: data?.sourceText || null,
            status: 'sent',
            senderId,
            chatId,
            metadata: {
              signs: Array.isArray(data?.signs) ? data.signs : [],
              segments: Array.isArray(data?.segments) ? data.segments : [],
              matchedWords: Array.isArray(data?.matchedWords) ? data.matchedWords : [],
              missingWords: Array.isArray(data?.missingWords) ? data.missingWords : [],
            }
          },
          include: { sender: { select: { id: true, name: true, avatar: true } } }
        });

        await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

        const payload = {
          id: savedMessage.id,
          chatId: savedMessage.chatId,
          senderId: savedMessage.senderId,
          senderName: savedMessage.sender?.name || data?.senderName || 'User',
          senderAvatar: savedMessage.sender?.avatar || null,
          text: savedMessage.text,
          kind: savedMessage.kind,
          sourceText: savedMessage.sourceText,
          status: 'sent',
          createdAt: savedMessage.createdAt,
          reactions: [],
          ...(savedMessage.metadata && typeof savedMessage.metadata === 'object' ? savedMessage.metadata : {}),
        };

        chatNs.to(normalizeChatRoom(chatId)).emit('receive_message', payload);

        const room = chatNs.adapter.rooms?.get(normalizeChatRoom(chatId));
        if (room) {
          let hasOtherOnline = false;
          for (const socketId of room) {
            const s = chatNs.sockets.get(socketId);
            if (s && s.data.userId && s.data.userId !== senderId) {
              hasOtherOnline = true;
              break;
            }
          }
          if (hasOtherOnline) {
            await prisma.message.update({ where: { id: savedMessage.id }, data: { status: 'delivered' } });
            chatNs.to(normalizeChatRoom(chatId)).emit('message_status', {
              messageId: savedMessage.id,
              status: 'delivered',
            });
          }
        }
      } catch (error) {
        console.error('Error saving/broadcasting message:', error);
      }
    });

    socket.on('typing', ({ chatId, userId, userName }) => {
      const uid = socket.data.userId || userId;
      if (!chatId || !uid) return;
      socket.to(normalizeChatRoom(chatId)).emit('user_typing', {
        chatId,
        userId: uid,
        userName: userName || uid,
      });
      const key = `${chatId}:${uid}`;
      clearTimeout(typingTimers.get(key));
      typingTimers.set(key, setTimeout(() => {
        socket.to(normalizeChatRoom(chatId)).emit('user_stop_typing', { chatId, userId: uid });
        typingTimers.delete(key);
      }, 4000));
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      const uid = socket.data.userId || userId;
      if (!chatId || !uid) return;
      const key = `${chatId}:${uid}`;
      clearTimeout(typingTimers.get(key));
      typingTimers.delete(key);
      socket.to(normalizeChatRoom(chatId)).emit('user_stop_typing', { chatId, userId: uid });
    });

    socket.on('message_seen', async ({ messageId, chatId }) => {
      const uid = socket.data.userId;
      if (!messageId || !chatId || !uid) return;
      try {
        const msg = await prisma.message.findUnique({
          where: { id: messageId },
          select: { id: true, senderId: true, status: true, chatId: true }
        });
        if (!msg || msg.chatId !== chatId || msg.senderId === uid || msg.status === 'seen') return;

        await prisma.message.update({ where: { id: messageId }, data: { status: 'seen' } });
        chatNs.to(normalizeChatRoom(chatId)).emit('message_status', { messageId, status: 'seen' });
      } catch (e) {
        console.error('message_seen error:', e);
      }
    });

    socket.on('toggle_reaction', async ({ chatId, messageId, emoji }) => {
      const uid = socket.data.userId;
      if (!uid || !chatId || !messageId || !emoji || !ALLOWED_REACTIONS.has(emoji)) return;

      try {
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            chatId,
            chat: {
              OR: [{ isGlobal: true }, { participants: { some: { id: uid } } }]
            }
          },
          select: { id: true, chatId: true }
        });
        if (!message) return;

        const existing = await prisma.messageReaction.findFirst({
          where: { messageId, userId: uid, emoji },
          select: { id: true }
        });

        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.messageReaction.create({
            data: { messageId, userId: uid, emoji }
          });
        }

        const reactions = await prisma.messageReaction.findMany({
          where: { messageId },
          select: {
            id: true,
            emoji: true,
            userId: true,
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        });

        chatNs.to(normalizeChatRoom(chatId)).emit('message_reactions', {
          messageId,
          reactions: shapeReactionGroups(reactions),
        });
      } catch (e) {
        console.error('toggle_reaction error:', e);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Chat user disconnected:', socket.id);
      const uid = socket.data.userId;
      if (uid) {
        try {
          await prisma.user.update({ where: { id: uid }, data: { isOnline: false } });
          chatNs.emit('user_status', { userId: uid, isOnline: false });
        } catch (e) {
          console.error('disconnect presence error:', e);
        }
      }
    });
  });
}
