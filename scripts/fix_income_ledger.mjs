import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const incomes = await prisma.income.findMany();
    let fixed = 0;
    for (const income of incomes) {
      if (income.source) {
        const ledgers = await prisma.ledgerEntry.findMany({
          where: { referenceId: income.id, module: 'Income' }
        });
        for (const ledger of ledgers) {
          if (ledger.accountType !== income.source) {
            await prisma.ledgerEntry.update({
              where: { id: ledger.id },
              data: { accountType: income.source }
            });
            fixed++;
          }
        }
      }
    }
    console.log(`Fixed ${fixed} ledger entries to match their income sources.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
