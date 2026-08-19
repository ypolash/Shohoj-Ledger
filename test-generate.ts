import { prisma } from './lib/prisma';
import { generateSalesOrderNumber } from './lib/crm/salesOrderService';

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) { console.log("No company"); return; }
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  console.log("dateStr:", dateStr);

  const latestOrder = await prisma.salesOrder.findFirst({
    where: { 
      companyId: company.id,
      salesOrderNumber: { startsWith: `SO-${dateStr}-` }
    },
    orderBy: { salesOrderNumber: 'desc' }
  });
  console.log("latestOrder from DB:", latestOrder?.salesOrderNumber);

  const num1 = await generateSalesOrderNumber(company.id);
  console.log("Generated num1:", num1);
}
main().catch(console.error).finally(() => prisma.$disconnect());
