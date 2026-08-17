import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const ledgers = await prisma.ledgerEntry.findMany();
    let bankBalance = 0;
    let cashBalance = 0;
    
    ledgers.forEach(l => {
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const net = debit - credit;
      const accType = (l.accountType || '').toUpperCase();
      console.log("Acc:", accType, "Net:", net);
      if (accType.includes('CASH')) cashBalance += net;
      if (accType.includes('BANK')) bankBalance += net;
      if (accType.includes('ENTRY')) bankBalance += net; // Just guessing... wait...
    });
    console.log("Bank:", bankBalance, "Cash:", cashBalance);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
