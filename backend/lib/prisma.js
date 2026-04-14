import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__signovaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__signovaPrisma = prisma;
}

export default prisma;
