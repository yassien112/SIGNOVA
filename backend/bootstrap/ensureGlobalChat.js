export async function ensureGlobalChat(prisma) {
  const globalChat = await prisma.chat.findUnique({ where: { id: 'chat-1' } });

  if (!globalChat) {
    await prisma.chat.create({ data: { id: 'chat-1' } });
  }
}
