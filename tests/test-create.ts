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
      customerCode: "CUST-001",
      currency: "BDT",
      creditLimit: 0,
      contacts: {
        create: {
          name: "Test",
          isPrimary: true,
          companyId
        }
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
