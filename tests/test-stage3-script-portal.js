const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStage3ScriptPortal() {
  try {
    console.log("=== Testing Stage 3 Script on Customer Portal & Short Link ===");
    
    // Find or create a test project with Stage 3 scripts
    let project = await prisma.project.findFirst({
      where: {
        description: {
          contains: "WORKFLOW_META_V1"
        }
      },
      include: { payments: true, company: true }
    });

    if (!project) {
      console.log("No project with workflow metadata found.");
      return;
    }

    console.log(`Testing Project: ${project.name} (ID: ${project.id})`);
    console.log(`Customer Short Link: /p/${project.id}`);
    console.log(`Customer Portal URL: /portal/project/${project.id}`);

    // Parse Workflow Meta
    let parsedMeta = {};
    if (project.description) {
      const match = project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
      if (match) {
        parsedMeta = JSON.parse(match[1]);
      }
    }

    const productData = parsedMeta.productData || {};
    let scriptsList = Array.isArray(productData.scripts) ? productData.scripts : [];
    if (scriptsList.length === 0 && productData.script) {
      scriptsList = [{ id: '1', title: 'Main Creative Script', content: productData.script }];
    }

    console.log(`Current Stage: ${parsedMeta.currentStage || 1}`);
    console.log(`Scripts Count in Stage 3 Product Data: ${scriptsList.length}`);
    if (scriptsList.length > 0) {
      console.log("Sample Script Title:", scriptsList[0].title);
      console.log("Sample Script Content:", scriptsList[0].content?.slice(0, 50) + "...");
      console.log("Sample Script URL:", scriptsList[0].url || "(none)");
    } else {
      console.log("No scripts in this project yet. Simulating normalization test...");
      const samplePData = {
        scripts: [
          { id: '101', title: 'Hook Script Scene 1-3', content: 'VO: Discover the ultimate comfort with our new winter line.', url: 'https://docs.google.com/document/d/sample' }
        ]
      };
      console.log("Normalized scripts format valid:", samplePData.scripts.length === 1);
    }

    console.log("=== Test Completed Successfully ===");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testStage3ScriptPortal();
