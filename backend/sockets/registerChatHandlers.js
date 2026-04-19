function normalizeChatRoom(chatId) {
  return `chat:${chatId}`;
}

export function registerChatHandlers(io, prisma) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', async (userId) => {
      socket.data.userId = userId;

      try {
        await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
        io.emit('user_status', { userId, isOnline: true });
      } catch (error) {
        console.error('Could not update presence', error);
      }
    });

    socket.on('join_chat', async (chatId) => {
      if (!chatId) {
        return;
      }

      socket.join(normalizeChatRoom(chatId));
    });

    socket.on('send_message', async (data) => {
      try {
        const senderId = socket.data.userId || data?.senderId;
        const chatId = data?.chatId;
        const text = String(data?.text ?? '').trim();

        if (!senderId || !chatId || !text) {
          return;
        }

        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          select: { id: true }
        });

        if (!chat) {
          return;
        }

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
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() }
        });

        io.to(normalizeChatRoom(chatId)).emit('receive_message', {
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
      console.log('User disconnected:', socket.id);

      if (!socket.data.userId) {
        return;
      }

      try {
        await prisma.user.update({
          where: { id: socket.data.userId },
          data: { isOnline: false }
        });

        io.emit('user_status', {
          userId: socket.data.userId,
          isOnline: false
        });
      } catch (error) {
        console.error('Could not update disconnect presence', error);
      }
    });
  });
}
