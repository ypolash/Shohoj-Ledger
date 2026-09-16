const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProjectPaymentCustomCost() {
  console.log('=== TESTING PROJECT PAYMENT WITH CUSTOM COST BUDGET DEDUCTION ===\n');

  // 1. Find a company
  const company = await prisma.company.findFirst();
  if (!company) throw new Error('No company found for test');

  // 2. Create test project with initial budget
  const initialBudget = 100000;
  const project = await prisma.project.create({
    data: {
      name: `Budget Cost Test Project - ${Date.now()}`,
      companyId: company.id,
      estimatedBudget: initialBudget,
      actualCost: 0,
      status: 'Active',
    },
  });
  console.log(`✓ Created test project "${project.name}" with budget: ৳${initialBudget}`);

  // 3. Simulate payment transaction with custom cost
  const paymentAmount = 25000;
  const customCost = 15000;
  const costReason = 'Third-party API license fee';
  const paymentMethod = 'Bank Transfer';

  const currentBudget = Number(project.estimatedBudget || 0);
  const updatedBudget = Math.max(0, currentBudget - customCost);

  await prisma.$transaction(async (tx) => {
    // Deduct custom cost from estimatedBudget & increment actualCost
    await tx.project.update({
      where: { id: project.id },
      data: {
        estimatedBudget: updatedBudget,
        actualCost: { increment: customCost },
      },
    });

    // Create expense
    await tx.expense.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        category: 'Project Custom Cost',
        amount: customCost,
        paymentMethod,
        approvalStatus: 'APPROVED',
        description: `Project "${project.name}" custom cost: ${costReason} (deducted from budget)`,
        systemSource: 'ERP',
      },
    });

    // Create payment entry
    const costTag = `[Custom Cost: -৳${customCost.toLocaleString()} (${costReason}) • New Budget: ৳${updatedBudget.toLocaleString()}]`;
    await tx.projectPayment.create({
      data: {
        projectId: project.id,
        amount: paymentAmount,
        paymentMethod,
        notes: costTag,
        paidToStaff: 0,
        profit: paymentAmount,
      },
    });
  });

  // 4. Verify updated project in database
  const updatedProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: { payments: true },
  });

  console.log(`\n--- VERIFICATION ---`);
  console.log(`Original Budget: ৳${initialBudget}`);
  console.log(`Custom Cost: -৳${customCost}`);
  console.log(`Updated Budget in DB: ৳${Number(updatedProject.estimatedBudget)}`);
  console.log(`Actual Incurred Cost: ৳${Number(updatedProject.actualCost)}`);
  console.log(`Payments recorded: ${updatedProject.payments.length}`);
  console.log(`Payment notes: ${updatedProject.payments[0].notes}`);

  if (Number(updatedProject.estimatedBudget) !== initialBudget - customCost) {
    throw new Error(`Budget was not deducted correctly! Expected ${initialBudget - customCost}, got ${updatedProject.estimatedBudget}`);
  }

  if (Number(updatedProject.actualCost) !== customCost) {
    throw new Error(`Actual cost was not updated correctly! Expected ${customCost}, got ${updatedProject.actualCost}`);
  }

  // 5. Cleanup
  await prisma.projectPayment.deleteMany({ where: { projectId: project.id } });
  await prisma.expense.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  console.log(`\n✓ Cleanup test records completed.`);

  console.log('\n======================================================');
  console.log(' ALL CUSTOM COST BUDGET DEDUCTION TESTS PASSED!');
  console.log('======================================================\n');
}

testProjectPaymentCustomCost()
  .catch((e) => {
    console.error('Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
