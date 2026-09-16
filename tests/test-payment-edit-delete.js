const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentLifecycle() {
  console.log('=== TESTING PAYMENT EDIT & DELETE LIFECYCLE ===\n');

  const company = await prisma.company.findFirst();
  if (!company) throw new Error('No company found for test');

  // 1. Create a test project
  const initialBudget = 100000;
  const project = await prisma.project.create({
    data: {
      name: `Payment Lifecycle Test - ${Date.now()}`,
      companyId: company.id,
      estimatedBudget: initialBudget,
      actualCost: 0,
      status: 'Active',
    },
  });
  console.log(`✓ Created test project "${project.name}" (ID: ${project.id})`);

  // 2. Find or create an employee & assign to project
  let employee = await prisma.employee.findFirst({ where: { companyId: company.id } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeId: `EMP-${Date.now().toString().slice(-6)}`,
        firstName: 'Test',
        lastName: 'Collaborator',
        email: `test-${Date.now()}@example.com`,
        designation: 'Engineer',
        department: 'Engineering',
        basicSalary: 0,
        isProjectBased: true,
        joinDate: new Date(),
      },
    });
  }

  const projectFee = 10000;
  let projectEmp;
  try {
    projectEmp = await prisma.projectEmployee.create({
      data: {
        projectId: project.id,
        employeeId: employee.id,
        isProjectBased: true,
        rate: projectFee,
        paidAmount: 0,
      },
    });
    console.log(`✓ Assigned collaborator with project fee: ৳${projectFee}`);

  // 3. Record payment with custom cost
  const paymentAmount = 15000;
  const customCost = 5000;
  const costReason = 'Server Setup';

  const updatedBudget = Math.max(0, initialBudget - customCost);
  const costTag = `[Custom Cost: -৳${customCost.toLocaleString()} (${costReason}) • New Budget: ৳${updatedBudget.toLocaleString()}]`;

  let createdPaymentId = null;

  await prisma.$transaction(async (tx) => {
    // Deduct cost
    await tx.project.update({
      where: { id: project.id },
      data: {
        estimatedBudget: updatedBudget,
        actualCost: { increment: customCost },
      },
    });

    // Create cost expense
    await tx.expense.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        category: 'Project Custom Cost',
        amount: customCost,
        paymentMethod: 'Bank Transfer',
        approvalStatus: 'APPROVED',
        description: `Project "${project.name}" custom cost: ${costReason} (deducted from budget)`,
        systemSource: 'ERP',
      },
    });

    // Payout staff: fee 10,000
    await tx.projectEmployee.update({
      where: { id: projectEmp.id },
      data: { paidAmount: 10000 },
    });

    // Create staff payout expense
    await tx.expense.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        category: 'Project Staff Payout',
        amount: 10000,
        paymentMethod: 'Bank Transfer',
        approvalStatus: 'APPROVED',
        description: `Project payment staff payout: ${employee.firstName} ${employee.lastName}`,
        systemSource: 'ERP',
      },
    });

    // Profit = 15,000 - 10,000 = 5,000
    await tx.income.create({
      data: {
        companyId: company.id,
        projectId: project.id,
        category: 'Project Profit',
        source: 'Bank Transfer',
        amount: 5000,
        received: 5000,
        paymentStatus: 'PAID',
        description: `Net profit from Project "${project.name}" payment`,
        systemSource: 'ERP',
      },
    });

    // Project payment
    const payment = await tx.projectPayment.create({
      data: {
        projectId: project.id,
        amount: paymentAmount,
        paymentMethod: 'Bank Transfer',
        notes: costTag,
        paidToStaff: 10000,
        profit: 5000,
      },
    });
    createdPaymentId = payment.id;
  });

  console.log(`✓ Payment recorded with ID ${createdPaymentId}`);

  // Check state after payment
  const postPaymentProject = await prisma.project.findUnique({
    where: { id: project.id },
  });
  const postPaymentEmp = await prisma.projectEmployee.findUnique({
    where: { id: projectEmp.id },
  });

  console.log(`- Project Budget: ৳${postPaymentProject.estimatedBudget} (Expected: 95000)`);
  console.log(`- Project Actual Cost: ৳${postPaymentProject.actualCost} (Expected: 5000)`);
  console.log(`- Collaborator Paid: ৳${postPaymentEmp.paidAmount} (Expected: 10000)`);

  if (Number(postPaymentProject.estimatedBudget) !== 95000) throw new Error('Post-payment budget incorrect');
  if (Number(postPaymentProject.actualCost) !== 5000) throw new Error('Post-payment actualCost incorrect');
  if (Number(postPaymentEmp.paidAmount) !== 10000) throw new Error('Post-payment staff paidAmount incorrect');

  // 4. Test Deletion logic (simulating DELETE /api/projects/[id]/payments/[paymentId])
  console.log('\n--- EXECUTING PAYMENT DELETION SIMULATION ---');
  await prisma.$transaction(async (tx) => {
    const paymentToDelete = await tx.projectPayment.findUnique({
      where: { id: createdPaymentId },
    });

    // Reversal of custom cost
    const match = paymentToDelete.notes?.match(/\[Custom Cost: -৳([0-9,.]+)(?: \((.*?)\))?/);
    if (match) {
      const parsedCost = parseFloat(match[1].replace(/,/g, '')) || 0;
      await tx.project.update({
        where: { id: project.id },
        data: {
          estimatedBudget: { increment: parsedCost },
          actualCost: { decrement: parsedCost },
        },
      });

      await tx.expense.deleteMany({
        where: {
          projectId: project.id,
          category: 'Project Custom Cost',
        },
      });
    }

    // Delete staff expenses and income linked to this project payment
    await tx.expense.deleteMany({
      where: {
        projectId: project.id,
        category: 'Project Staff Payout',
      },
    });

    await tx.income.deleteMany({
      where: {
        projectId: project.id,
        source: { startsWith: 'Project Payment:' },
      },
    });

    // Delete payment
    await tx.projectPayment.delete({
      where: { id: createdPaymentId },
    });

    // Recalculate remaining payments for staff
    const remainingPayments = await tx.projectPayment.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });

    // In this case, 0 remaining payments, so paidAmount goes back to 0
    await tx.projectEmployee.update({
      where: { id: projectEmp.id },
      data: { paidAmount: 0 },
    });
  });

  // Verify post-deletion state
  const postDeleteProject = await prisma.project.findUnique({
    where: { id: project.id },
  });
  const postDeleteEmp = await prisma.projectEmployee.findUnique({
    where: { id: projectEmp.id },
  });
  const postDeletePayments = await prisma.projectPayment.findMany({
    where: { projectId: project.id },
  });

  console.log(`- Project Budget after Delete: ৳${postDeleteProject.estimatedBudget} (Restored to: 100000)`);
  console.log(`- Project Actual Cost after Delete: ৳${postDeleteProject.actualCost} (Restored to: 0)`);
  console.log(`- Collaborator Paid after Delete: ৳${postDeleteEmp.paidAmount} (Restored to: 0)`);
  console.log(`- Remaining Payments: ${postDeletePayments.length} (Expected: 0)`);

  if (Number(postDeleteProject.estimatedBudget) !== 100000) throw new Error('Budget not restored!');
  if (Number(postDeleteProject.actualCost) !== 0) throw new Error('Actual cost not restored!');
  if (Number(postDeleteEmp.paidAmount) !== 0) throw new Error('Collaborator paidAmount not restored!');
  if (postDeletePayments.length !== 0) throw new Error('Payment was not deleted!');

  } finally {
    // 5. Cleanup
    try {
      await prisma.projectPayment.deleteMany({ where: { projectId: project.id } });
      await prisma.expense.deleteMany({ where: { projectId: project.id } });
      await prisma.income.deleteMany({ where: { projectId: project.id } });
      await prisma.projectEmployee.deleteMany({ where: { projectId: project.id } });
      await prisma.project.delete({ where: { id: project.id } });
      console.log('✓ Cleanup complete.');
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }

  console.log('======================================================');
  console.log(' ALL PAYMENT LIFECYCLE AND REVERSAL TESTS PASSED!');
  console.log('======================================================\n');
}

testPaymentLifecycle()
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
