import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'me@mail.com' },
    include: { accounts: true },
  });
  console.log("User in User table:", JSON.stringify(user, null, 2));

  const employee = await prisma.employee.findFirst({
    where: { email: 'me@mail.com' }
  });
  console.log("Employee in Employee table:", JSON.stringify(employee, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
