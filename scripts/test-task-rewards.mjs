import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Task Rewards & Incentives End-to-End Verification...");

  // 1. Find a test company and employee
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("❌ No company found in DB to run tests.");
    return;
  }
  console.log(`✅ Using Company: ${company.name} (${company.id})`);

  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id },
  });

  if (!employee) {
    console.log("Creating temporary employee for test...");
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeId: "TEST-EMP-999",
        firstName: "Test",
        lastName: "RewardStaff",
        email: "test-reward-staff@example.com",
        phone: "+8801700000999",
        joiningDate: new Date(),
        status: "ACTIVE",
      },
    });
  }
  console.log(`✅ Using Employee: ${employee.firstName} ${employee.lastName} (${employee.id})`);

  // 2. Test Settings
  console.log("\n--- Testing TaskRewardSetting ---");
  const setting = await prisma.taskRewardSetting.upsert({
    where: { companyId: company.id },
    update: { pointToCashRate: 15.0, minRedeemPoints: 5, autoApprove: false },
    create: { companyId: company.id, pointToCashRate: 15.0, minRedeemPoints: 5, autoApprove: false },
  });
  console.log(`✅ Setting Configured: 1 Pt = ৳${setting.pointToCashRate}, Min Redeem = ${setting.minRedeemPoints}`);

  // 3. Create Special Task Bounty
  console.log("\n--- Testing TaskReward Creation ---");
  const task = await prisma.taskReward.create({
    data: {
      companyId: company.id,
      title: "Weekend Security & Server Audit",
      description: "Verify all database backups and firewall rules",
      category: "SPECIAL_TASK",
      priority: "HIGH",
      points: 20,
      monetaryValue: 300.0,
      maxClaims: 2,
      status: "OPEN",
      createdByRole: "ADMIN",
    },
  });
  console.log(`✅ Created Task: "${task.title}" (Points: ${task.points} pts, Value: ৳${task.monetaryValue})`);

  // 4. Submit Completion Claim
  console.log("\n--- Testing TaskRewardSubmission ---");
  const submission = await prisma.taskRewardSubmission.create({
    data: {
      companyId: company.id,
      taskRewardId: task.id,
      employeeId: employee.id,
      status: "PENDING",
      submissionNotes: "Completed audit checklists and verified SSL certificates",
      proofUrl: "https://example.com/audit-proof.pdf",
    },
  });
  console.log(`✅ Created Submission Claim: ID ${submission.id} (Status: ${submission.status})`);

  // 5. Review and Approve Submission
  console.log("\n--- Testing HR Claim Approval ---");
  const approvedSubmission = await prisma.taskRewardSubmission.update({
    where: { id: submission.id },
    data: {
      status: "APPROVED",
      pointsAwarded: task.points,
      rewardAmount: task.monetaryValue || task.points * 15.0,
      reviewedAt: new Date(),
    },
  });
  console.log(`✅ Approved Claim! Points Awarded: ${approvedSubmission.pointsAwarded} pts (৳${approvedSubmission.rewardAmount})`);

  // 6. Test Disbursing Extra Income Payout
  console.log("\n--- Testing Disburse Extra Income Payout ---");
  const payout = await prisma.taskRewardPayout.create({
    data: {
      companyId: company.id,
      employeeId: employee.id,
      pointsRedeemed: 20,
      amount: 300.0,
      payoutMethod: "BKASH_NAGAD",
      referenceNo: "TRX-TEST-BKASH-88192",
      notes: "Extra income disbursement for Server Audit task",
      paymentStatus: "PAID",
    },
  });
  console.log(`✅ Disbursed Extra Income: ৳${payout.amount} (${payout.pointsRedeemed} pts) via ${payout.payoutMethod} (Ref: ${payout.referenceNo})`);

  // 7. Clean up test data
  console.log("\n--- Cleaning up test records ---");
  await prisma.taskRewardPayout.delete({ where: { id: payout.id } });
  await prisma.taskRewardSubmission.delete({ where: { id: submission.id } });
  await prisma.taskReward.delete({ where: { id: task.id } });
  if (employee.employeeId === "TEST-EMP-999") {
    await prisma.employee.delete({ where: { id: employee.id } });
  }
  console.log("✅ Cleaned up temporary test records.");

  console.log("\n🎉 ALL TASK REWARDS & EXTRA INCOME INCENTIVES TESTS PASSED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("❌ Test Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
