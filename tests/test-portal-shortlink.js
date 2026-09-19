const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPortal() {
  try {
    console.log("=== Testing Portal Backend & Project Short Link ===");
    const project = await prisma.project.findFirst({
      include: { payments: true }
    });

    if (!project) {
      console.log("No project found to test.");
      return;
    }

    console.log(`Found project: ${project.name} (${project.id})`);
    console.log(`Short Link URL: /p/${project.id}`);
    console.log(`Portal URL: /portal/project/${project.id}`);

    // Parse Workflow Meta
    let parsedMeta = {};
    if (project.description) {
      const match = project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
      if (match) {
        parsedMeta = JSON.parse(match[1]);
      }
    }

    console.log("Current Stage in Meta:", parsedMeta.currentStage || 1);
    console.log("Estimated Budget:", project.estimatedBudget);
    console.log("Payments Count:", project.payments.length);

    console.log("=== Test Completed Successfully ===");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testPortal();
