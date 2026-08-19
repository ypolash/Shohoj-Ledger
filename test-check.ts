import { prisma } from './lib/prisma';
async function main() {
  const orders = await prisma.salesOrder.findMany({
    where: { salesOrderNumber: 'SO-20260819-0006' }
  });
  console.log("Found orders:", orders.length);
  if (orders.length > 0) {
    console.log("Belongs to company:", orders[0].companyId);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
