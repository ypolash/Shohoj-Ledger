"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";
import { revalidatePath } from "next/cache";

export async function fetchMyLeaveRequests() {
  const { employeeId, companyId } = await getEssEmployeeId();

  return await prisma.leaveRequest.findMany({
    where: { companyId, employeeId, systemSource: "ERP" },
    orderBy: { createdAt: "desc" }
  });
}

export async function applyMyLeave(data: { type: string; startDate: string; endDate: string; reason: string }) {
  const { employeeId, companyId } = await getEssEmployeeId();

  const matchingType = await prisma.leaveType.findFirst({
    where: {
      companyId,
      name: data.type
    }
  });

  const isShortBreak = matchingType?.description?.includes("TIMER_CONFIG") ||
                       matchingType?.description?.includes("SHORT_BREAK") ||
                       data.type.toLowerCase().includes("break");

  let start = data.startDate ? new Date(data.startDate) : new Date();
  let end = data.endDate ? new Date(data.endDate) : new Date();
  let finalStatus = "PENDING";
  let comments: string | null = null;

  if (isShortBreak) {
    let durationMinutes = 30;
    let graceMinutes = 5;
    let fineAmt = 50;

    if (matchingType?.description?.includes("TIMER_CONFIG")) {
      try {
        const match = matchingType.description.match(/\[TIMER_CONFIG:({.*?})\]/s);
        if (match) {
          const cfg = JSON.parse(match[1]);
          durationMinutes = Number(cfg.duration) || 30;
          graceMinutes = Number(cfg.grace) || 5;
          fineAmt = Number(cfg.fine) || 50;
        }
      } catch {}
    }

    const now = new Date();
    start = now;
    end = new Date(now.getTime() + durationMinutes * 60 * 1000);
    finalStatus = "APPROVED"; // Auto-Approved instantly
    comments = `Auto-Approved Short Break: ${durationMinutes}m duration (+${graceMinutes}m grace). Overstay fine: ৳${fineAmt}.`;
  } else {
    if (start > end) {
      throw new Error("Invalid leave dates: Start date must be before end date.");
    }

    // Prevent overlapping leave requests for regular leaves
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        companyId,
        systemSource: "ERP",
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
  }

  const req = await prisma.leaveRequest.create({
    data: {
      companyId,
      systemSource: "ERP",
      employeeId,
      leaveTypeId: matchingType?.id || null,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason || (isShortBreak ? "Short Break" : "Leave Request"),
      status: finalStatus,
      comments
    }
  });

  revalidatePath("/erp/ess/leave");
  return req;
}

export async function cancelMyLeave(id: string) {
  const { employeeId, companyId } = await getEssEmployeeId();
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId, employeeId, systemSource: "ERP" } });
  if (!existing) throw new Error("Leave request not found");
  if (existing.status !== "PENDING") throw new Error("You can only cancel pending requests. Contact HR for approved leaves.");

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "CANCELLED" }
  });

  revalidatePath("/erp/ess/leave");
  return { success: true };
}
