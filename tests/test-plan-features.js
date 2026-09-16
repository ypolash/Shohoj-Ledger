const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPlanFeatureTests() {
  console.log('=== STARTING SUBSCRIPTION PLAN FEATURE SELECTION TESTS ===\n');

  // 1. Check current plans
  console.log('--- TEST 1: Check Current Database Subscription Plans ---');
  const initialPlans = await prisma.subscriptionPlan.findMany();
  console.log(`Found ${initialPlans.length} existing plans in database.`);

  // 2. Create Plan with Custom Features
  console.log('\n--- TEST 2: Create Subscription Plan with Custom CRM Features ---');
  const testPlanName = `CRM Custom Suite - ${Date.now()}`;
  const customFeatures = ['crm_customers', 'crm_leads', 'crm_quotations'];

  const createdPlan = await prisma.subscriptionPlan.create({
    data: {
      name: testPlanName,
      price: 35.0,
      billingCycle: 'MONTHLY',
      maxUsers: 8,
      features: customFeatures,
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Plan created successfully: "${createdPlan.name}" (ID: ${createdPlan.id})`);
  console.log(`  Assigned features:`, createdPlan.features);
  if (createdPlan.features.length !== 3 || !createdPlan.features.includes('crm_quotations')) {
    throw new Error('Features were not properly saved in the database!');
  }

  // 3. Update Plan Features
  console.log('\n--- TEST 3: Update Plan with Additional CRM Features ---');
  const expandedFeatures = [...customFeatures, 'crm_opportunities', 'crm_reports'];
  const updatedPlan = await prisma.subscriptionPlan.update({
    where: { id: createdPlan.id },
    data: {
      name: `${testPlanName} (Upgraded)`,
      features: expandedFeatures,
      price: 59.0,
    },
  });

  console.log(`✓ Plan updated successfully: "${updatedPlan.name}"`);
  console.log(`  New features count: ${updatedPlan.features.length}`);
  console.log(`  Updated features list:`, updatedPlan.features);
  if (updatedPlan.features.length !== 5 || !updatedPlan.features.includes('crm_reports')) {
    throw new Error('Features were not updated properly in the database!');
  }

  // 4. Test safe cleanup
  console.log('\n--- TEST 4: Cleanup Test Plan ---');
  await prisma.subscriptionPlan.delete({
    where: { id: createdPlan.id },
  });
  console.log(`✓ Test plan deleted successfully.`);

  console.log('\n======================================================');
  console.log(' ALL PLAN FEATURE SELECTION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runPlanFeatureTests()
  .catch((e) => {
    console.error('Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
