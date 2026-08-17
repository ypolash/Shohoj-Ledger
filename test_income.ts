import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const income = await prisma.income.create({
      data: {
        companyId: "0ccaacc6-cda2-4558-9f72-e7d98e00e24e",
        category: "1",
        source: "Fast Entry",
        amount: 400,
        received: 400,
        paymentStatus: "PAID",
        shareable: true,
        description: "Test description",
        systemSource: "ERP"
      }
    });
    console.log("Income created", income);
  } catch (e) {
    console.error("Error creating income", e);
  }
}
test().finally(() => prisma.$disconnect());
