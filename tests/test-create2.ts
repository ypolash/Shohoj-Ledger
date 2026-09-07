import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const companyId = (await prisma.company.findFirst())?.id;
  const userId = (await prisma.user.findFirst())?.id;
  
  if (!companyId || !userId) {
    console.log('No company or user');
    return;
  }
  
  try {
    const data = {
      name: "Test",
      customerCode: "CUST-002",
      email: undefined,
      phone: "015",
      customerGroupId: undefined,
      creditLimit: 5000,
      currency: "BDT",
      priceLevel: "Net 30",
      taxNumber: undefined,
      tradeLicense: undefined,
      contacts: {
        create: {
          name: "Test",
          email: undefined,
          phone: "015",
          isPrimary: true,
          companyId
        }
      },
      addresses: {
        create: [
          { type: "BILLING", addressLine1: "Jessore", isDefault: true, companyId },
          { type: "SHIPPING", addressLine1: "Jessore", isDefault: false, companyId }
        ]
      }
    };
    
    await prisma.customer.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
        tags: []
      }
    });
    console.log("Success");
  } catch (e: any) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
