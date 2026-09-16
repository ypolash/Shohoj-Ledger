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

  return await prisma.task.findMany({
    where: { companyId, assignedToEmployeeId: employee.employeeId },
    orderBy: { createdAt: "desc" }
  });
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
