"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";
import { revalidatePath } from "next/cache";

export async function fetchMyTasks() {
  const { employeeId, companyId } = await getEssEmployeeId();

  // First we need to get the actual employeeId string (e.g. 'EMP-001') to query Tasks
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });

  if (!employee) throw new Error("Employee not found");

  const [regularTasks, specialTasks, setting] = await Promise.all([
    prisma.task.findMany({
      where: { companyId, assignedToEmployeeId: employee.employeeId },
      orderBy: { createdAt: "desc" }
    }),
    (prisma as any).taskReward.findMany({
      where: {
        companyId,
        status: { in: ["OPEN", "IN_PROGRESS", "ACTIVE"] },
        OR: [
          { assignedToEmployeeId: null },
          { assignedToEmployeeId: employee.id },
          { assignedToEmployeeId: employee.employeeId },
          ...(employee.departmentId ? [{ departmentId: employee.departmentId }] : [])
        ]
      },
      include: {
        submissions: {
          where: { employeeId: employee.id }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    (prisma as any).taskRewardSetting.findUnique({
      where: { companyId }
    })
  ]);

  const pointRate = setting ? Number(setting.pointToCashRate) : 10;

  const mappedSpecial = (specialTasks || []).map((st: any) => {
    const mySub = st.submissions && st.submissions.length > 0 ? st.submissions[0] : null;
    let mappedStatus = "Pending";
    if (mySub) {
      if (mySub.status === "APPROVED") mappedStatus = "Completed";
      else if (mySub.status === "PENDING") mappedStatus = "In Progress";
      else mappedStatus = "Blocked";
    }

    const cashValue = st.monetaryValue ? Number(st.monetaryValue) : st.points * pointRate;

    return {
      id: st.id,
      title: st.title,
      description: st.description,
      status: mappedStatus,
      priority: st.priority || "High",
      dueDate: st.deadline,
      assignedToEmployeeId: st.assignedToEmployeeId || employee.employeeId,
      createdAt: st.createdAt,
      checklist: st.checklist,
      isSpecialTask: true,
      points: st.points,
      rewardAmount: cashValue,
      submissionStatus: mySub ? mySub.status : null,
      maxClaims: st.maxClaims
    };
  });

  const mappedRegular = regularTasks.map((t: any) => ({
    ...t,
    isSpecialTask: false,
    points: 0,
    rewardAmount: 0,
    submissionStatus: null
  }));

  return [...mappedSpecial, ...mappedRegular];
}

export async function updateMyTaskStatus(taskId: string, status: string) {
  const { employeeId, companyId } = await getEssEmployeeId();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });
  if (!employee) throw new Error("Employee not found");

  const existing = await prisma.task.findFirst({
    where: { id: taskId, companyId, assignedToEmployeeId: employee.employeeId }
  });

  if (!existing) throw new Error("Task not found or you don't have permission to update it.");

  await prisma.task.update({
    where: { id: taskId },
    data: { status }
  });

  revalidatePath("/erp/ess/tasks");
  return { success: true };
}

export async function toggleMyTaskChecklistItem(taskId: string, itemId: string, completed: boolean) {
  const { employeeId, companyId } = await getEssEmployeeId();

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  });
  if (!employee) throw new Error("Employee not found");

  const existing = await prisma.task.findFirst({
    where: { id: taskId, companyId, assignedToEmployeeId: employee.employeeId }
  });

  if (!existing) throw new Error("Task not found or you don't have permission to update it.");

  let checklistData: any = existing.checklist;
  if (!checklistData) {
    throw new Error("No checklist found on this task");
  }
  if (typeof checklistData === "string") {
    try {
      checklistData = JSON.parse(checklistData);
    } catch {
      throw new Error("Invalid checklist JSON");
    }
  }

  let items: any[] = [];
  if (Array.isArray(checklistData)) {
    items = [...checklistData];
  } else if (Array.isArray(checklistData.items)) {
    items = [...checklistData.items];
  }

  const updatedItems = items.map((item) => {
    if (item.id === itemId) {
      return { ...item, completed };
    }
    return item;
  });

  const newChecklist = Array.isArray(checklistData)
    ? updatedItems
    : { ...checklistData, items: updatedItems };

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { checklist: newChecklist }
  });

  revalidatePath("/erp/ess/tasks");
  return { success: true, task: updated };
}
