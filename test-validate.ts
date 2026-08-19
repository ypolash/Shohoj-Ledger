import { PrismaClient } from '@prisma/client';
import { validateCustomer } from './lib/crm/customerService';
const prisma = new PrismaClient();

async function test() {
  const companyId = (await prisma.company.findFirst())?.id;
  const customer = await prisma.customer.findFirst({ where: { companyId } });
  
  if (!customer || !companyId) {
    console.log("No customer found");
    return;
  }
  
  console.log("Testing with customer:", customer.id, customer.customerCode);
  
  try {
    await validateCustomer(companyId, {
      id: customer.id,
      customerCode: customer.customerCode,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
    });
    console.log("Validation passed!");
  } catch (err: any) {
    console.error("Validation failed:", err.message);
  }
}
test().catch(console.error);
