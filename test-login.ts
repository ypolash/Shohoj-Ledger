import { prisma } from "./lib/prisma";

async function main() {
  const user = await prisma.user.findFirst({
    include: { accounts: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log("Recent User:", JSON.stringify(user, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
