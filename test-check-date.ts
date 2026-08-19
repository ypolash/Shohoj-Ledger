import { prisma } from './lib/prisma';
async function main() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  console.log("Current dateStr:", dateStr);

  const orders = await prisma.salesOrder.findMany({
    where: { salesOrderNumber: `SO-${dateStr}-0001` }
  });
  console.log(`Found orders for SO-${dateStr}-0001:`, orders.length);
  
  const ordersTomorrow = await prisma.salesOrder.findMany({
    where: { salesOrderNumber: `SO-20260820-0001` }
  });
  console.log(`Found orders for SO-20260820-0001:`, ordersTomorrow.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
