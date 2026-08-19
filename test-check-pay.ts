import { prisma } from './lib/prisma';
async function main() {
  const pays = await prisma.customerPayment.findMany({
    where: { paymentNumber: 'PAY-20260819-0001' }
  });
  console.log("Found pays for PAY-20260819-0001:", pays.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
