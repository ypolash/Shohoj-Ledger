import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allocations = await prisma.customerPaymentAllocation.findMany({
    where: { referenceType: 'SALES_ORDER' },
  });
  
  const soAllocations = {};
  for (const alloc of allocations) {
    const soId = alloc.referenceId;
    if (!soAllocations[soId]) soAllocations[soId] = 0;
    soAllocations[soId] += Number(alloc.allocatedAmount);
  }
  
  for (const soId of Object.keys(soAllocations)) {
    const so = await prisma.salesOrder.findFirst({ where: { id: soId } });
    if (so) {
      const description = `Sales Order ${so.salesOrderNumber}`;
      const income = await prisma.income.findFirst({ where: { companyId: so.companyId, description, systemSource: "ERP_CRM" } });
      if (income) {
        const received = soAllocations[soId];
        const newPaymentStatus = received >= Number(income.amount) ? "PAID" : "PARTIAL";
        await prisma.income.update({
          where: { id: income.id },
          data: { received, paymentStatus: newPaymentStatus }
        });
        console.log(`Updated Income for SO ${so.salesOrderNumber}: received ${received}, status ${newPaymentStatus}`);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
