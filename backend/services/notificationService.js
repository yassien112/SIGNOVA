/**
 * Centralised notification helper.
 * Call createNotification() from anywhere (routes, sockets, services).
 * If an io instance is passed, it pushes a real-time event to the user's socket room.
 */

export async function createNotification(prisma, { userId, type, title, message, link }, io = null) {
  const notification = await prisma.notification.create({
    data: { userId, type, title: title || null, message, link: link || null },
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
}

/**
 * Convenience wrappers for common notification types.
 */
export const NotificationType = Object.freeze({
  MESSAGE:      'message',
  SIGN_SENT:    'sign_sent',
  MENTION:      'mention',
  SYSTEM:       'system',
  WELCOME:      'welcome',
});

export async function notifyNewMessage(prisma, io, { toUserId, fromName, chatId }) {
  return createNotification(prisma, {
    userId:  toUserId,
    type:    NotificationType.MESSAGE,
    title:   'New message',
    message: `${fromName} sent you a message`,
    link:    `/chat/${chatId}`,
  }, io);
}

export async function notifySignSent(prisma, io, { toUserId, fromName, signWord }) {
  return createNotification(prisma, {
    userId:  toUserId,
    type:    NotificationType.SIGN_SENT,
    title:   'Sign received',
    message: `${fromName} sent the sign "${signWord}"`,
    link:    null,
  }, io);
}

export async function notifyWelcome(prisma, io, { userId, name }) {
  return createNotification(prisma, {
    userId,
    type:    NotificationType.WELCOME,
    title:   'Welcome to SIGNOVA 👋',
    message: `Welcome ${name}! Start chatting and exploring signs.`,
    link:    '/',
  }, io);
}
