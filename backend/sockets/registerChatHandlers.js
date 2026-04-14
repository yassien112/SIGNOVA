export function registerChatHandlers(io, prisma) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', async (userId) => {
      socket.data.userId = userId;
      socket.join('chat-1');

      try {
        await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
        io.emit('user_status', { userId, isOnline: true });
      } catch (error) {
        console.error('Could not update presence', error);
      }
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('send_message', async (data) => {
      try {
        socket.broadcast.emit('receive_message', data);
      } catch (error) {
        console.error('Error broadcasting message:', error);
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
