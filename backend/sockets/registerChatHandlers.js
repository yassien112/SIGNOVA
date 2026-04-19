import { createSocketAuthMiddleware } from './socketAuthMiddleware.js';

function normalizeChatRoom(chatId) {
  return `chat:${chatId}`;
}

export function registerChatHandlers(io, prisma, jwtSecret) {
  const chatNs = io.of('/chat');

  // JWT middleware on /chat namespace
  if (jwtSecret) {
    chatNs.use(createSocketAuthMiddleware(jwtSecret));
  }

  chatNs.on('connection', (socket) => {
    console.log('Chat user connected:', socket.id, '| userId:', socket.data.userId ?? 'guest');

    // Allow explicit register (for clients that send userId manually)
    socket.on('register', async (userId) => {
      const uid = socket.data.userId || userId;
      if (!uid) return;
      socket.data.userId = uid;

      try {
        await prisma.user.update({ where: { id: uid }, data: { isOnline: true } });
        chatNs.emit('user_status', { userId: uid, isOnline: true });
      } catch (error) {
        console.error('Could not update presence', error);
      }
    });

    socket.on('join_chat', async (chatId) => {
      if (!chatId) return;

      const userId = socket.data.userId;

      // Verify user is participant (or chat is global)
      if (userId) {
        try {
          const chat = await prisma.chat.findFirst({
            where: {
              id: chatId,
              OR: [
                { isGlobal: true },
                { participants: { some: { id: userId } } }
              ]
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

      // Leave previous chat rooms to avoid receiving messages from old chats
      const currentRooms = [...socket.rooms].filter((r) => r.startsWith('chat:'));
      currentRooms.forEach((r) => socket.leave(r));

      socket.join(normalizeChatRoom(chatId));
    });

    socket.on('send_message', async (data) => {
      try {
        const senderId = socket.data.userId || data?.senderId;
        const chatId = data?.chatId;
        const text = String(data?.text ?? '').trim();

        if (!senderId || !chatId || !text) return;

        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            OR: [
              { isGlobal: true },
              { participants: { some: { id: senderId } } }
            ]
          },
          select: { id: true }
        });

        if (!chat) return;

        const savedMessage = await prisma.message.create({
          data: {
            text,
            kind: data?.kind || 'text',
            sourceText: data?.sourceText || null,
            status: data?.status || 'sent',
            senderId,
            chatId,
            metadata: {
              signs: Array.isArray(data?.signs) ? data.signs : [],
              segments: Array.isArray(data?.segments) ? data.segments : [],
              matchedWords: Array.isArray(data?.matchedWords) ? data.matchedWords : [],
              missingWords: Array.isArray(data?.missingWords) ? data.missingWords : []
            }
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } }
          }
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() }
        });

        chatNs.to(normalizeChatRoom(chatId)).emit('receive_message', {
          id: savedMessage.id,
          chatId: savedMessage.chatId,
          senderId: savedMessage.senderId,
          senderName: savedMessage.sender?.name || data?.senderName || 'User',
          senderAvatar: savedMessage.sender?.avatar || null,
          text: savedMessage.text,
          kind: savedMessage.kind,
          sourceText: savedMessage.sourceText,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt,
          ...(savedMessage.metadata && typeof savedMessage.metadata === 'object'
            ? savedMessage.metadata
            : {})
        });
      } catch (error) {
        console.error('Error saving/broadcasting message:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Chat user disconnected:', socket.id);
      const uid = socket.data.userId;
      if (!uid) return;

      try {
        await prisma.user.update({ where: { id: uid }, data: { isOnline: false } });
        chatNs.emit('user_status', { userId: uid, isOnline: false });
      } catch (error) {
        console.error('Could not update disconnect presence', error);
      }
    });
  });
}
