const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      modules: {
        include: { module: true }
      }
    }
  });

  for (const c of companies) {
    console.log(`Company: ${c.name} (ID: ${c.id})`);
    console.log(` Modules: ${c.modules.map(m => m.module.key).join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
