import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    // If no email provided, promote all users with role 'Owner' or existing users
    console.log("No specific email provided. Finding users to promote...");
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log("No registered users found.");
      return;
    }

    for (const u of users) {
      await prisma.user.update({
        where: { id: u.id },
        data: { platformRole: 'SUPER_ADMIN' },
      });
      console.log(`✓ Promoted ${u.name} (${u.email}) to SUPER_ADMIN!`);
    }
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail.toLowerCase().trim() },
  });

  if (!user) {
    console.error(`✗ User with email "${targetEmail}" not found.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { platformRole: 'SUPER_ADMIN' },
  });

  console.log(`✓ Successfully promoted ${updated.name} (${updated.email}) to SUPER_ADMIN!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
