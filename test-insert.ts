import { prisma } from './lib/prisma';

async function main() {
  const company = await prisma.company.findFirst();
  const customer = await prisma.customer.findFirst();
  const user = await prisma.user.findFirst();
  
  if (!company || !customer || !user) return console.log("Missing relations");

  try {
    const order = await prisma.salesOrder.create({
      data: {
        companyId: company.id,
        salesOrderNumber: 'SO-20260819-0006',
        customerId: customer.id,
        createdById: user.id,
        orderDate: new Date(),
        subtotal: 100,
        totalAmount: 115,
        currency: 'BDT'
      }
    });
    console.log("Successfully created order:", order.id);
  } catch (err: any) {
    console.error("Prisma error:", err.message);
    if (err.code) console.error("Code:", err.code);
    if (err.meta) console.error("Meta:", err.meta);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
