import { prisma } from "../lib/prisma";
import {
  listFollowUps,
  createFollowUp,
  updateFollowUp,
  getFollowUpStats,
  deleteFollowUp,
} from "../lib/crm/followUpService";

async function runTest() {
  console.log("=== Testing Follow-Up & Appointment Feature ===");

  // 1. Find a test company and user
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found in database.");
    return;
  }
  const user = await prisma.user.findFirst({ where: { companyId: company.id } }) || await prisma.user.findFirst();
  if (!user) {
    console.log("No user found in database.");
    return;
  }

  console.log(`Using Company: ${company.name} (${company.id})`);
  console.log(`Using User: ${user.name} (${user.id})`);

  // 2. Test booking an appointment for a NEW customer who appointed us later
  const testPhone = `+8801700${Math.floor(100000 + Math.random() * 900000)}`;
  const testName = "Mr. Rafiqul Islam (Appointed Later)";
  const appointmentDate = new Date(Date.now() + 2 * 86400000); // 2 days in future

  console.log(`\n1. Creating follow-up for new customer: ${testName} with phone ${testPhone}...`);
  const created = await createFollowUp(company.id, user.id, {
    customerName: testName,
    phone: testPhone,
    email: "rafiqul.test@example.com",
    companyName: "Dhaka Soft Ltd",
    address: "Gulshan-2, Dhaka",
    type: "MEETING",
    title: "Initial System Demo & Requirements Analysis",
    date: appointmentDate,
    priority: "HIGH",
    agenda: "Demonstrate ERP core modules, discuss custom integrations.",
    location: "Dhaka Soft HQ, Gulshan-2",
  });

  console.log("-> Follow-up created successfully!");
  console.log(`   Follow-up ID: ${created.id}`);
  console.log(`   Auto-saved Customer ID: ${created.customerId}`);
  console.log(`   Customer Name: ${created.customer.name}`);
  console.log(`   Customer Code: ${created.customer.customerCode}`);
  console.log(`   Scheduled Date: ${created.date}`);

  // Verify that customer actually exists in database
  const customerInDb = await prisma.customer.findUnique({
    where: { id: created.customerId },
  });
  console.log(`   Verified in Customer DB: ${customerInDb?.name} (${customerInDb?.customerCode})`);
  if (!customerInDb) throw new Error("Customer was not saved in database!");

  // 3. Test Listing Follow-ups with counts and dynamic status
  console.log("\n2. Listing follow-ups and stats...");
  const listResult = await listFollowUps(company.id, { search: "Rafiqul" });
  console.log(`-> Found ${listResult.data.length} records matching 'Rafiqul'`);
  console.log(`-> Overall counts: Total: ${listResult.counts.total}, Upcoming: ${listResult.counts.upcoming}, Today: ${listResult.counts.today}, Overdue: ${listResult.counts.overdue}`);

  // 4. Test Rescheduling the follow-up
  const newDate = new Date(Date.now() + 4 * 86400000);
  console.log(`\n3. Rescheduling follow-up to ${newDate.toISOString()}...`);
  const rescheduled = await updateFollowUp(company.id, created.id, {
    date: newDate,
    agenda: "Rescheduled upon client request. Focus on inventory modules.",
  });
  console.log(`-> Rescheduled successfully to: ${rescheduled.date}`);

  // 5. Test Completing the Follow-up with Outcome Notes
  console.log("\n4. Completing follow-up with outcome notes...");
  const completed = await updateFollowUp(company.id, created.id, {
    status: "COMPLETED",
    outcome: "Client agreed to purchase ERP Standard Package. Quotation requested.",
  });
  console.log(`-> Completed successfully! Status: ${completed.status}`);

  // 6. Test Stats Endpoint
  console.log("\n5. Testing getFollowUpStats...");
  const stats = await getFollowUpStats(company.id);
  console.log("-> Stats result:", JSON.stringify(stats, null, 2));

  // Clean up test data
  console.log("\n6. Cleaning up test follow-up and customer...");
  await deleteFollowUp(company.id, created.id);
  await prisma.customer.delete({ where: { id: created.customerId } });
  console.log("-> Clean up completed.");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
