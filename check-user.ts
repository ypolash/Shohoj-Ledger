import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ryanhasan360@gmail.com' },
    include: { accounts: true },
  });
  console.log("User:", user);
  
  const employee = await prisma.employee.findUnique({
    where: { email: 'ryanhasan360@gmail.com' },
  });
  console.log("Employee:", employee);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
