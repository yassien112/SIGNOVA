import { createSocketAuthMiddleware } from './socketAuthMiddleware.js';

function normalizeChatRoom(chatId) {
  return `chat:${chatId}`;
}

// In-memory typing timers — auto-clear if client never sends stop_typing
const typingTimers = new Map(); // key: `${chatId}:${userId}`

export function registerChatHandlers(io, prisma, jwtSecret) {
  const chatNs = io.of('/chat');

  if (jwtSecret) {
    chatNs.use(createSocketAuthMiddleware(jwtSecret));
  }

  chatNs.on('connection', (socket) => {
    console.log('Chat user connected:', socket.id, '| userId:', socket.data.userId ?? 'guest');

    /* ──────────────────────────────────────
       REGISTER / PRESENCE
    ────────────────────────────────────── */
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

    /* ──────────────────────────────────────
       JOIN ROOM
    ────────────────────────────────────── */
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
          if (!chat) { socket.emit('error', { message: 'Chat not found or access denied' }); return; }
        } catch (err) {
          console.error('join_chat DB error:', err);
        }
      }

      // Leave previous chat rooms
      const currentRooms = [...socket.rooms].filter((r) => r.startsWith('chat:'));
      currentRooms.forEach((r) => socket.leave(r));
      socket.join(normalizeChatRoom(chatId));
    });

    /* ──────────────────────────────────────
       SEND MESSAGE
    ────────────────────────────────────── */
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
          select: { id: true, isGlobal: true, participants: { select: { id: true } } }
        });
        if (!chat) return;

        const savedMessage = await prisma.message.create({
          data: {
            text,
            kind:        data?.kind       || 'text',
            sourceText:  data?.sourceText || null,
            status:      'sent',
            senderId,
            chatId,
            metadata: {
              signs:        Array.isArray(data?.signs)        ? data.signs        : [],
              segments:     Array.isArray(data?.segments)     ? data.segments     : [],
              matchedWords: Array.isArray(data?.matchedWords) ? data.matchedWords : [],
              missingWords: Array.isArray(data?.missingWords) ? data.missingWords : [],
            }
          },
          include: { sender: { select: { id: true, name: true, avatar: true } } }
        });

        await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

        const payload = {
          id:           savedMessage.id,
          chatId:       savedMessage.chatId,
          senderId:     savedMessage.senderId,
          senderName:   savedMessage.sender?.name || data?.senderName || 'User',
          senderAvatar: savedMessage.sender?.avatar || null,
          text:         savedMessage.text,
          kind:         savedMessage.kind,
          sourceText:   savedMessage.sourceText,
          status:       'sent',
          createdAt:    savedMessage.createdAt,
          ...(savedMessage.metadata && typeof savedMessage.metadata === 'object'
            ? savedMessage.metadata : {}),
        };

        // Broadcast to everyone in the room
        chatNs.to(normalizeChatRoom(chatId)).emit('receive_message', payload);

        // Auto-mark as delivered for all OTHER participants currently in the room
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

    /* ──────────────────────────────────────
       TYPING INDICATOR
    ────────────────────────────────────── */
    socket.on('typing', ({ chatId, userId, userName }) => {
      const uid = socket.data.userId || userId;
      if (!chatId || !uid) return;

      // Broadcast to room (excluding sender)
      socket.to(normalizeChatRoom(chatId)).emit('user_typing', {
        chatId,
        userId:   uid,
        userName: userName || uid,
      });

      // Auto-clear after 4s if client never sends stop_typing
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

    /* ──────────────────────────────────────
       MESSAGE SEEN
    ────────────────────────────────────── */
    socket.on('message_seen', async ({ messageId, chatId }) => {
      const uid = socket.data.userId;
      if (!messageId || !chatId || !uid) return;
      try {
        const msg = await prisma.message.findUnique({
          where: { id: messageId },
          select: { id: true, senderId: true, status: true }
        });
        // Only mark seen if message belongs to this chat and was sent by someone else
        if (!msg || msg.senderId === uid || msg.status === 'seen') return;

        await prisma.message.update({ where: { id: messageId }, data: { status: 'seen' } });
        chatNs.to(normalizeChatRoom(chatId)).emit('message_status', {
          messageId,
          status: 'seen',
        });
      } catch (e) {
        console.error('message_seen error:', e);
      }
    });

    /* ──────────────────────────────────────
       DISCONNECT
    ────────────────────────────────────── */
    socket.on('disconnect', async () => {
      console.log('Chat user disconnected:', socket.id);
      const uid = socket.data.userId;
      if (!uid) return;
      try {
        await prisma.user.update({ where: { id: uid }, data: { isOnline: false } });
        chatNs.emit('user_status', { userId: uid, isOnline: false });
      } catch (e) {
        console.error('disconnect presence error:', e);
      }
    });
  });
}
