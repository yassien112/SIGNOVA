const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const { seedSignCatalog } = await import('../bootstrap/seedSignCatalog.js');

async function main() {
  const result = await seedSignCatalog(prisma);
  console.log('seed sign catalog:', result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
