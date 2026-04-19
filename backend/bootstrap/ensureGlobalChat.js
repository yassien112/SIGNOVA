/**
 * Ensures the single global chat room exists in the database.
 * Called once at server startup.
 */
export async function ensureGlobalChat(prisma) {
  const exists = await prisma.chat.findUnique({ where: { id: 'chat-1' } });
  if (!exists) {
    await prisma.chat.create({
      data: {
        id: 'chat-1',
        isGlobal: true,
        isGroup: true,
        title: 'Global Community'
      }
    });
    console.log('[bootstrap] Global chat created.');
  }
}
