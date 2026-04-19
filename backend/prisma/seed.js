import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const count = await prisma.user.count();

  if (count === 0) {
    const hashedPassword = await bcrypt.hash('123456', 10);

    await prisma.user.createMany({
      data: [
        {
          name: 'Yassien Ali',
          email: 'yassien@example.com',
          password: hashedPassword,
          avatar: 'https://i.pravatar.cc/150?u=yassien',
          isOnline: true,
        },
        {
          name: 'Ahmed Hussien',
          email: 'sarah@example.com',
          password: hashedPassword,
          avatar: 'https://i.pravatar.cc/150?u=sarah',
          isOnline: false,
        },
        {
          name: 'New Account',
          email: 'newaccount@example.com',
          password: hashedPassword,
          avatar: 'https://i.pravatar.cc/150?u=newaccount',
          isOnline: false,
        },
      ],
    });
  }
}

main()
  .then(() => {
    console.log('🌱 Seed done');
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
