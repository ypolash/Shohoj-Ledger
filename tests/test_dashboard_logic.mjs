import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    const companyId = await prisma.company.findFirst().then(c => c?.id);
    if (!companyId) throw new Error("No company");

    const whereClause = { companyId };
    console.log("Fetching ledgers...");
    const ledgers = await prisma.ledgerEntry.findMany({
      where: whereClause,
      select: { id: true, debit: true, credit: true, module: true, accountType: true, date: true, description: true, referenceId: true, status: true },
      orderBy: { date: 'desc' }
    });
    console.log(`Found ${ledgers.length} ledgers`);

    // Loans and Advances
    console.log("Fetching loans...");
    const loans = await prisma.memberLoan.aggregate({
      where: whereClause, _sum: { remainingAmount: true }
    });
    console.log("Fetching advances...");
    const advances = await prisma.advance.aggregate({
      where: whereClause, _sum: { remainingAmount: true }
    });
    console.log("Fetching expenses groupBy...");
    const expenseCategories = await prisma.expense.groupBy({
      by: ['category'],
      where: whereClause,
      _sum: { amount: true }
    });
    console.log("Fetching income groupBy...");
    const revenueCategories = await prisma.income.groupBy({
      by: ['category'],
      where: whereClause,
      _sum: { amount: true }
    });

    console.log("SUCCESS!");
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
