"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function verifyAccess(permission: string) {
  const session = await getSession();
  if (!session?.user?.companyId) {
    throw new Error("Unauthorized or no company context.");
  }
  return { companyId: session.user.companyId };
}

export async function fetchLeaveRequests(employeeId?: string) {
  const { companyId } = await verifyAccess("VIEW_LEAVE");

  const whereClause: any = { companyId };
  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  return await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          department: true,
          designation: true,
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createLeaveRequest(data: { employeeId: string; type: string; startDate: string; endDate: string; reason: string }) {
  const { companyId } = await verifyAccess("MANAGE_LEAVE");

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (start > end) {
    throw new Error("Invalid leave dates: Start date must be before end date.");
  }

  // Prevent overlapping leave requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      companyId,
      employeeId: data.employeeId,
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
      employeeId: data.employeeId,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason,
      status: "PENDING"
    }
  });

  revalidatePath("/dashboard/staff-management/leave");
  return req;
}

export async function updateLeaveRequest(id: string, data: { type?: string; startDate?: string; endDate?: string; reason?: string }) {
  const { companyId } = await verifyAccess("MANAGE_LEAVE");
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Leave request not found");
  if (existing.status !== "PENDING") throw new Error("Only pending requests can be updated.");

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      type: data.type,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      reason: data.reason
    }
  });

  revalidatePath("/dashboard/staff-management/leave");
  return { success: true };
}

export async function approveLeaveRequest(id: string) {
  const { companyId } = await verifyAccess("APPROVE_LEAVE");
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Leave request not found");

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "APPROVED" }
  });

  revalidatePath("/dashboard/staff-management/leave");
  return { success: true };
}

export async function rejectLeaveRequest(id: string) {
  const { companyId } = await verifyAccess("APPROVE_LEAVE");
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Leave request not found");

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "REJECTED" }
  });

  revalidatePath("/dashboard/staff-management/leave");
  return { success: true };
}

export async function cancelLeaveRequest(id: string) {
  const { companyId } = await verifyAccess("MANAGE_LEAVE");
  
  const existing = await prisma.leaveRequest.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Leave request not found");

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "CANCELLED" }
  });

  revalidatePath("/dashboard/staff-management/leave");
  return { success: true };
}
