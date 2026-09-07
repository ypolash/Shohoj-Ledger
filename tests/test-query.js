const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const customer = await prisma.customer.findFirst();
  console.log(customer);
}
run();
