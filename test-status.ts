import { prisma } from './lib/prisma';
async function main() {
  const order = await prisma.salesOrder.findUnique({
    where: { id: "a3ea7e30-58fc-4a5d-a9bc-ab382d434d41" }
  });
  console.log("Order status:", order?.status);
}
main().catch(console.error).finally(() => prisma.$disconnect());
