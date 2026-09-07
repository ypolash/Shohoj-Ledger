import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@shohojsolution.com';
  const password = 'password123';
  
  // 1. Ensure company exists
  let company = await prisma.company.findFirst({ where: { name: 'Shohoj Solution' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Shohoj Solution', businessType: 'SERVICE', status: 'ACTIVE' }
    });
  }

  // 2. Ensure owner role exists
  let role = await prisma.role.findFirst({ where: { name: 'Owner', companyId: company.id } });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'Owner', companyId: company.id }
    });
  }

  // 3. Ensure user exists
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Shohoj Admin',
        emailVerified: true,
        platformRole: 'SUPER_ADMIN',
        companyId: company.id,
        role: 'Owner'
      }
    });
  } else {
    user = await prisma.user.update({
      where: { email },
      data: { companyId: company.id, role: 'Owner' }
    });
  }

  // 4. Ensure account (password) exists
  const hashedPassword = await bcrypt.hash(password, 10);
  let account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credentials',
        password: hashedPassword
      }
    });
  } else {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });
  }

  console.log(`Admin user seeded successfully!\nEmail: ${email}\nPassword: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
