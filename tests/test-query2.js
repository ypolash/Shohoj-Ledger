const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const customerId = "a3272201-c81b-461d-9cc6-8166ff22645d";
  
  // Find this specific customer
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  console.log("Current customer:", customer);

  if (!customer) {
    console.log("Customer not found.");
    return;
  }

  // Simulate validateCustomer query
  const existing = await prisma.customer.findFirst({
    where: {
      companyId: customer.companyId,
      OR: [
        { customerCode: customer.customerCode },
        { email: customer.email },
        { phone: customer.phone }
      ],
      id: { not: customerId }
    }
  });

  console.log("Existing customer found by validation:", existing);
}
run();
