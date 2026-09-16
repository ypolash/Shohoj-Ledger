import { prisma } from "../lib/prisma";

async function runChecklistTest() {
  console.log("--- Starting Task Checklist System Verification ---");

  // 1. Find a test company and employee or create a mock task
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found in database, skipping DB test");
    return;
  }
  console.log("Found company:", company.name, `(${company.id})`);

  const employee = await prisma.employee.findFirst({
    where: { companyId: company.id }
  });

  const assignedTo = employee ? employee.employeeId : "EMP-TEST";

  // 2. Test Creating a Checklist Task
  const testChecklist = {
    type: "CHECKLIST",
    items: [
      { id: "todo-1", title: "Collect employee tax documents", completed: false },
      { id: "todo-2", title: "Provision system workstation", completed: false },
      { id: "todo-3", title: "Sign non-disclosure agreement", completed: true }
    ]
  };

  const createdTask = await prisma.task.create({
    data: {
      companyId: company.id,
      title: "Automated Test: Employee Onboarding Checklist",
      description: "Test task to verify to-do checklist persistence",
      assignedToEmployeeId: assignedTo,
      priority: "High",
      status: "In Progress",
      systemSource: "ERP",
      checklist: testChecklist
    }
  });

  console.log("✓ Task created successfully with ID:", createdTask.id);
  console.log("✓ Initial checklist saved:", JSON.stringify(createdTask.checklist));

  // 3. Test Updating checklist item (toggling todo-1 to completed)
  const checklistData: any = createdTask.checklist;
  const updatedItems = checklistData.items.map((item: any) => 
    item.id === "todo-1" ? { ...item, completed: true } : item
  );

  const updatedTask = await prisma.task.update({
    where: { id: createdTask.id },
    data: {
      checklist: { ...checklistData, items: updatedItems }
    }
  });

  const updatedChecklist: any = updatedTask.checklist;
  const item1 = updatedChecklist.items.find((i: any) => i.id === "todo-1");
  if (item1 && item1.completed === true) {
    console.log("✓ Checklist item toggle persisted: todo-1 is now completed!");
  } else {
    throw new Error("Checklist toggle failed to persist!");
  }

  // 4. Test Reading back
  const retrieved = await prisma.task.findUnique({
    where: { id: createdTask.id }
  });

  const items: any = (retrieved?.checklist as any)?.items;
  const completedCount = items.filter((i: any) => i.completed).length;
  console.log(`✓ Retrieved task: ${completedCount}/${items.length} items completed (${Math.round((completedCount / items.length) * 100)}%)`);

  // 5. Cleanup
  await prisma.task.delete({
    where: { id: createdTask.id }
  });
  console.log("✓ Test task cleaned up successfully.");

  console.log("--- All Task Checklist System Tests Passed! ---");
}

runChecklistTest()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
