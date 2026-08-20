import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allocations = await prisma.customerPaymentAllocation.findMany({
    where: { referenceType: 'SALES_ORDER' },
    include: { customerPayment: true }
  });
  console.log('Total sales order allocations:', allocations.length);
  
  // Let's summarize by Sales Order
  const soAllocations = {};
  for (const alloc of allocations) {
    const soId = alloc.referenceId;
    if (!soAllocations[soId]) soAllocations[soId] = 0;
    soAllocations[soId] += Number(alloc.allocatedAmount);
  }
  console.log('Allocations by SO:', soAllocations);
}
main().catch(console.error).finally(() => prisma.$disconnect());
