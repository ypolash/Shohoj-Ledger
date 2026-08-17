import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'me@mail.com';
  const password = 'password123';

  const user = await prisma.user.findFirst({ where: { email } });
  if (user) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await prisma.account.findFirst({ where: { userId: user.id } });
    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword }
      });
      console.log('Password updated to "password123" for', email);
    }
  }
}

main().finally(() => prisma.$disconnect());
