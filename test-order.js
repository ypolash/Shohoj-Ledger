const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = '83203bda-7f12-409b-8381-08320944a4e3';
  const order = await prisma.salesOrder.findFirst({ where: { id: orderId }});
  const allocations = await prisma.customerPaymentAllocation.findMany({
    where: { referenceType: 'SALES_ORDER', referenceId: orderId }
  });
  console.log("Order:", order.totalAmount);
  console.log("Allocations:", allocations);
  
  const amountPaid = allocations.reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);
  const grandTotal = Number(order.totalAmount);
  let paymentStatus = "Unpaid";
  if (amountPaid > 0) {
    paymentStatus = amountPaid >= grandTotal ? "Paid" : "Partial";
  }
  
  const payload = { ...order, history: [], amountPaid, paymentStatus };
  console.log("Payload:", JSON.stringify(payload, null, 2));
}

main().finally(() => prisma.$disconnect());
