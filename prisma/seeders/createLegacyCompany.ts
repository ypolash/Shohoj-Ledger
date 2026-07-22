import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createLegacyCompany() {
  const companyName = 'Shohoj Solution';

  try {
    console.log('Starting Legacy Company Seeder...');

    // Execute within a transaction for safety
    await prisma.$transaction(async (tx) => {
      // 1. Check whether a legacy company already exists
      const existingCompany = await tx.company.findFirst({
        where: { name: companyName }
      });

      // 2. If it exists, exit safely, do nothing
      if (existingCompany) {
        console.log(`Company "${companyName}" already exists. Exiting safely.`);
        return;
      }

      // 3. If it does not exist, create the default legacy company
      console.log(`Creating default legacy company: ${companyName}...`);
      
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          businessType: 'SERVICE',
          status: 'ACTIVE',
          // Note: Industry Template conceptually applied via defaults below
          settings: {
            create: {
              currency: 'BDT',
              timezone: 'Asia/Dhaka',
              workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
              weeklyHolidays: ["Friday", "Saturday"],
              shiftStartTime: "09:00",
              shiftEndTime: "18:00",
              gracePeriodMinutes: 15
            }
          }
        }
      });

      console.log(`Successfully created legacy company: ${newCompany.name} (ID: ${newCompany.id})`);
    });

  } catch (error) {
    console.error('Error executing Legacy Company Seeder:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow execution directly if invoked via node/ts-node
if (require.main === module) {
  createLegacyCompany().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
