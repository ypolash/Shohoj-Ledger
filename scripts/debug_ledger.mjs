import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const ledgers = await prisma.ledgerEntry.findMany({
      orderBy: { date: 'desc' }
    });
    console.log("=== LEDGER ENTRIES ===");
    for (const l of ledgers) {
      console.log(`[${l.module}] Acc: ${l.accountType} | Debit: ${l.debit} | Credit: ${l.credit} | Net: ${Number(l.debit) - Number(l.credit)}`);
    }
    
    console.log("=== INCOMES ===");
    const incomes = await prisma.income.findMany();
    for (const i of incomes) {
      console.log(`Income: ${i.amount} | Received: ${i.received} | Source: ${i.source}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
