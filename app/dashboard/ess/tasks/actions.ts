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

  revalidatePath("/dashboard/ess/tasks");
  return { success: true };
}
