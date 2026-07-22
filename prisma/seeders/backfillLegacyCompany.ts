import { PrismaClient } from '@prisma/client';
import { 
  BackfillContext, 
  processInBatches, 
  safeUpdate 
} from './utils/backfillEngine';

const prisma = new PrismaClient();

const MODELS_TO_BACKFILL = [
  'advance', 'allowedNetwork', 'attendance', 'attendanceConfig', 'bonus',
  'employee', 'expense', 'fundTransaction', 'income', 'incomeCategory',
  'lead', 'leaveRequest', 'member', 'memberLoan', 'payslip', 'project',
  'punishmentSetting', 'reserveTransaction', 'salaryDeduction', 'salaryPayment',
  'settlement', 'task', 'user'
];

export async function runBackfill(dryRun: boolean = false, batchSize: number = 500) {
  console.log(`Starting Legacy Data Backfill (Dry Run: ${dryRun}, Batch Size: ${batchSize})`);
  
  // 1. Locate Legacy Company
  const legacyCompany = await prisma.company.findFirst({
    where: { name: 'Shohoj Solution' }
  });

  if (!legacyCompany) {
    throw new Error('STOP: Legacy Company "Shohoj Solution" does not exist. Run Legacy Company Seeder first.');
  }

  const companyId = legacyCompany.id;
  const ctx: BackfillContext = { prisma, dryRun, batchSize };

  // 2. Process every approved model
  for (const modelName of MODELS_TO_BACKFILL) {
    console.log(`\n========================================`);
    console.log(`Processing Model: ${modelName}`);
    
    const modelDelegate = (prisma as any)[modelName];
    if (!modelDelegate) {
      console.warn(`Model ${modelName} not found on Prisma Client. Skipping.`);
      continue;
    }

    // 3. Update ONLY records having companyId = NULL
    // (We also select just the ID to keep memory usage extremely low)
    const recordsToUpdate = await modelDelegate.findMany({
      where: { companyId: null },
      select: { id: true }
    });

    const totalNeedingUpdate = recordsToUpdate.length;
    
    // Count already assigned to provide accurate logging
    const alreadyAssignedCount = await modelDelegate.count({
      where: { companyId: { not: null } }
    });

    console.log(`Records needing update: ${totalNeedingUpdate}`);
    console.log(`Already Assigned Records: ${alreadyAssignedCount}`);

    if (totalNeedingUpdate === 0) {
      console.log(`[${modelName}] No records need backfilling. Skipped.`);
      continue;
    }

    // Execute through the generic backfill engine
    const result = await processInBatches(
      ctx,
      recordsToUpdate,
      modelName,
      async (record: { id: string }, tx) => {
        const delegate = (tx as any)[modelName];
        
        // 4. Never overwrite an existing companyId
        // By filtering purely on companyId: null above, we are already protected.
        // The safeUpdate helper will handle standard updates or log mock outputs for dry run.
        await safeUpdate(ctx, delegate, record.id, { companyId });
      }
    );

    console.log(`[${modelName}] Backfill Results:`);
    console.log(`  Processed Records: ${totalNeedingUpdate}`);
    console.log(`  Updated Records: ${result.totalProcessed - result.totalFailed}`);
    console.log(`  Failed Records: ${result.totalFailed}`);

    if (result.totalFailed > 0) {
      console.error(`[${modelName}] Failures detected! Stopping backfill to prevent corruption.`);
      throw new Error(`Failed to backfill ${result.totalFailed} records in model ${modelName}.`);
    }

    // Post-update Validation
    if (!dryRun) {
      const remainingNulls = await modelDelegate.count({
        where: { companyId: null }
      });
      if (remainingNulls > 0) {
        throw new Error(`[${modelName}] Validation Failed! ${remainingNulls} records still have companyId = NULL.`);
      }
      console.log(`[${modelName}] Validation Passed: No NULL companyId remaining.`);
    }
  }

  console.log('\nLegacy Data Backfill fully complete.');
}

// Allow execution directly via node / ts-node
if (require.main === module) {
  // Parse simple argv flags
  const isDryRun = process.argv.includes('--dry-run');
  const batchIndex = process.argv.indexOf('--batch-size');
  const batchSize = batchIndex !== -1 ? parseInt(process.argv[batchIndex + 1], 10) : 500;

  runBackfill(isDryRun, batchSize)
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
