import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  try {
    const loans = await prisma.memberLoan.aggregate({
      _sum: { remainingAmount: true }
    });
    console.log(loans);
    const advances = await prisma.advance.aggregate({
      _sum: { remainingAmount: true }
    });
    console.log(advances);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
