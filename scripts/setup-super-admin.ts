import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'team@shohoj.com';
  const superAdminPassword = 'Rh@25981#';

  console.log('1. Demoting regular tenant accounts back to platformRole USER...');
  await prisma.user.updateMany({
    where: {
      email: {
        not: superAdminEmail,
      },
    },
    data: {
      platformRole: 'USER',
    },
  });
  console.log('✓ All other users set to platformRole: USER');

  console.log(`2. Setting up dedicated Super Admin account: ${superAdminEmail}...`);
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  let adminUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Shohoj Platform Admin',
        emailVerified: true,
        platformRole: 'SUPER_ADMIN',
        role: 'SuperAdmin',
        companyId: null, // Global platform admin - not tied to a single tenant
        accounts: {
          create: {
            accountId: superAdminEmail,
            providerId: 'credentials',
            password: hashedPassword,
          },
        },
      },
    });
    console.log(`✓ Created new dedicated Super Admin user: ${adminUser.email}`);
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        name: 'Shohoj Platform Admin',
        platformRole: 'SUPER_ADMIN',
        role: 'SuperAdmin',
        companyId: null,
      },
    });

    const account = await prisma.account.findFirst({
      where: { userId: adminUser.id },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: adminUser.id,
          accountId: superAdminEmail,
          providerId: 'credentials',
          password: hashedPassword,
        },
      });
    }
    console.log(`✓ Updated Super Admin account with new password`);
  }

  console.log('\n======================================================');
  console.log(' DEDICATED SUPER ADMIN INITIALIZED SUCCESSFULLY!');
  console.log(` Email:    ${superAdminEmail}`);
  console.log(` Password: ${superAdminPassword}`);
  console.log(' Access:   Exclusively manages all tenants (8 Lines, Circle, etc.)');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
