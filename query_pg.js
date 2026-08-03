const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const mLoans = await prisma.memberLoan.findMany({ include: { loans: true } });
    console.log("Member Loans:", JSON.stringify(mLoans, null, 2));
  } catch(e) {
    console.log("Error querying MemberLoan:", e.message);
  }
}
run();
