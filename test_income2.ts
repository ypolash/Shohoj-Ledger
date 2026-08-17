import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const incomeId = "9242a51f-7bf8-4ef4-97af-f82f07934c96";
    const companyId = "0ccaacc6-cda2-4558-9f72-e7d98e00e24e";
    
    console.log("Creating ledger entry...");
    const entry = await prisma.ledgerEntry.create({
      data: {
        companyId,
        voucherNo: 'INC-0001',
        voucherType: 'Income Voucher',
        referenceId: incomeId,
        module: 'Income',
        accountType: 'Bank',
        debit: 400,
        credit: 0,
        description: `Income Received: 1 ()`,
        createdById: undefined,
        systemSource: 'ERP'
      }
    });
    console.log("Ledger entry created", entry.id);

    console.log("Deleting settlements...");
    await prisma.settlement.deleteMany({ 
        where: { companyId, period: "August 2026", systemSource: "ERP" } 
    });
    console.log("Done deleting");

  } catch (e) {
    console.error("Error", e);
  }
}
test().finally(() => prisma.$disconnect());
