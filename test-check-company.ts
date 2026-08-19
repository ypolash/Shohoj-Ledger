import { prisma } from './lib/prisma';
async function main() {
  const order = await prisma.salesOrder.findUnique({
    where: { salesOrderNumber: `SO-20260819-0001` }
  });
  console.log("Order company:", order?.companyId);

  const myCompany = await prisma.company.findFirst();
  console.log("My company:", myCompany?.id);
  
  if (order?.companyId !== myCompany?.id) {
    console.log("DIFFERENT COMPANIES!");
  } else {
    console.log("SAME COMPANY!");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
