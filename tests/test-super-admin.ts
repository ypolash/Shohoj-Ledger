import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- TEST 1: Check Super Admin User ---');
  const superAdmins = await prisma.user.findMany({
    where: { platformRole: 'SUPER_ADMIN' },
    select: { id: true, name: true, email: true, platformRole: true },
  });
  console.log(`Found ${superAdmins.length} SUPER_ADMIN users:`, superAdmins.map(u => u.email).join(', '));
  if (superAdmins.length === 0) throw new Error('No SUPER_ADMIN found!');

  console.log('\n--- TEST 2: Check Subscription Plans & Assignment ---');
  const plans = await prisma.subscriptionPlan.findMany({ where: { status: 'ACTIVE' } });
  console.log(`Found ${plans.length} active subscription plans:`, plans.map(p => p.name).join(', '));
  if (plans.length === 0) throw new Error('No subscription plans found!');

  const company = await prisma.company.findFirst();
  if (company) {
    const sub = await prisma.subscription.upsert({
      where: { companyId: company.id },
      update: { planId: plans[0].id, status: 'ACTIVE' },
      create: {
        companyId: company.id,
        planId: plans[0].id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true, company: true },
    });
    console.log(`✓ Subscription assigned for company "${sub.company.name}": Plan "${sub.plan.name}", expires: ${sub.currentPeriodEnd.toISOString()}`);
  }

  console.log('\n--- TEST 3: Check Support Ticket Creation & Thread ---');
  const adminUser = superAdmins[0];
  const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject: 'Test Integration Ticket: Need clarification on ERP billing',
      description: 'Customer inquiry created via automated test suite.',
      priority: 'HIGH',
      category: 'BILLING',
      userId: adminUser.id,
      companyId: company?.id || null,
      messages: {
        create: [
          {
            senderId: adminUser.id,
            senderName: adminUser.name,
            senderRole: 'USER',
            message: 'Hello, I have a question regarding the billing cycle.',
          },
          {
            senderId: adminUser.id,
            senderName: 'Super Admin',
            senderRole: 'SUPER_ADMIN',
            message: 'Hello! Super Admin here. Your billing cycle is monthly on the 1st.',
          }
        ]
      }
    },
    include: {
      messages: true,
      user: true,
      company: true,
    }
  });
  console.log(`✓ Support Ticket Created: [${ticket.ticketNumber}] "${ticket.subject}" with ${ticket.messages.length} messages.`);

  // Cleanup test ticket
  await prisma.supportTicket.delete({ where: { id: ticket.id } });
  console.log(`✓ Cleaned up test ticket.`);

  console.log('\n======================================');
  console.log(' ALL SUPER ADMIN VERIFICATIONS PASSED!');
  console.log('======================================');
}

runTests()
  .catch((e) => {
    console.error('Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
