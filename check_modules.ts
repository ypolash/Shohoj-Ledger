import { PrismaClient } from '@prisma/client';
import { ModuleService } from './lib/modules/moduleService';

const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany({ select: { companyId: true }});
  const companyId = users[0].companyId;
  console.log("Checking modules for company:", companyId);
  if (companyId) {
     const modules = await ModuleService.listActiveModules(companyId);
     console.log("Active modules:", modules);
  }
}
test().finally(() => prisma.$disconnect());
