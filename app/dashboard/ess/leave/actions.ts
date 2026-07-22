"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";
import { revalidatePath } from "next/cache";

export async function fetchMyLeaveRequests() {
  const { employeeId, companyId } = await getEssEmployeeId();

  return await prisma.leaveRequest.findMany({
    where: { companyId, employeeId },
    orderBy: { createdAt: "desc" }
  });
}

export async function applyMyLeave(data: { type: string; startDate: string; endDate: string; reason: string }) {
  const { employeeId, companyId } = await getEssEmployeeId();

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (start > end) {
    throw new Error("Invalid leave dates: Start date must be before end date.");
  }

  // Prevent overlapping leave requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      companyId,
      employeeId,
      status: { not: "REJECTED" },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } }
      ]
    }
  });

  if (overlapping) {
    throw new Error("Leave request overlaps with an existing pending or approved request.");
  }

  const req = await prisma.leaveRequest.create({
    data: {
      companyId,
      employeeId,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason,
      status: "PENDING"
    }
  });

  revalidatePath("/dashboard/ess/leave");
  return req;
}

export async function cancelMyLeave(id: string) {
  const { employeeId, companyId } = await getEssEmployeeId();
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId, employeeId } });
  if (!existing) throw new Error("Leave request not found");
  if (existing.status !== "PENDING") throw new Error("You can only cancel pending requests. Contact HR for approved leaves.");

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "CANCELLED" }
  });

  revalidatePath("/dashboard/ess/leave");
  return { success: true };
}
