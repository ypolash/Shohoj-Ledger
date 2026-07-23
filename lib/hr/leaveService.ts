import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createLeaveRequest(companyId: string, employeeId: string, data: any) {
  // Uses legacy string type if leaveTypeId not provided
  return prisma.leaveRequest.create({
    data: {
      ...data,
      companyId,
      employeeId,
      status: 'SUBMITTED'
    }
  });
}

export async function approveLeave(requestId: string, approverId: string, level: number, comments?: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Record the approval level
    await tx.leaveApproval.create({
      data: {
        leaveRequestId: requestId,
        approverId,
        level,
        status: 'APPROVED',
        comments
      }
    });

    // 2. Fetch the request to check policy
    const request = await tx.leaveRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { leaveType: { include: { leavePolicies: true } } }
    });

    const policy = request.leaveType?.leavePolicies[0];
    const maxLevels = policy ? policy.approvalLevels : 1;

    // 3. If final level reached, officially approve it
    if (level >= maxLevels) {
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', approvedById: approverId }
      });
      
      // Post-Approval Note:
      // The Attendance module/worker will read this APPROVED leave request 
      // and map it across the Attendance grid for those dates.
      // We do NOT modify Attendance directly here.
    }

    return true;
  });
}

export async function rejectLeave(requestId: string, approverId: string, comments?: string) {
  return prisma.$transaction(async (tx) => {
    await tx.leaveApproval.create({
      data: {
        leaveRequestId: requestId,
        approverId,
        level: 1, // Rejection instantly kills the flow
        status: 'REJECTED',
        comments
      }
    });

    return tx.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });
  });
}

export async function cancelLeave(requestId: string) {
  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' }
  });
}

export async function calculateBalance(employeeId: string, leaveTypeId: string, year: number) {
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId,
        year
      }
    }
  });

  return balance ? Number(balance.remaining) : 0;
}

export async function accrueLeave(employeeId: string, leaveTypeId: string, amount: number, type: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Create Ledger Entry
    await tx.leaveAccrual.create({
      data: {
        employeeId,
        leaveTypeId,
        amount,
        type
      }
    });

    // 2. Update Balance
    const year = new Date().getFullYear();
    const balance = await tx.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year
        }
      },
      update: {
        earned: { increment: amount },
        remaining: { increment: amount }
      },
      create: {
        employeeId,
        leaveTypeId,
        year,
        earned: amount,
        remaining: amount
      }
    });

    return balance;
  });
}

export async function carryForward(companyId: string, yearFrom: number) {
  // Logic to calculate carry forward amounts bounded by carryForwardLimit
  // Will generate MANUAL LeaveAccrual records for yearFrom + 1
  return true;
}

export async function encashLeave(employeeId: string, leaveTypeId: string, days: number, amount: number) {
  return prisma.$transaction(async (tx) => {
    // 1. Deduct Balance
    const year = new Date().getFullYear();
    await tx.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId,
          year
        }
      },
      data: {
        used: { increment: days },
        remaining: { decrement: days }
      }
    });

    // 2. Create Encashment Record
    return tx.leaveEncashment.create({
      data: {
        employeeId,
        leaveTypeId,
        days,
        amount,
        status: 'PENDING'
        // postingReference will be injected by the Posting Engine via Webhook/Worker later
      }
    });
  });
}

export async function validateLeave(companyId: string, requestId: string) {
  const req = await prisma.leaveRequest.findFirst({
    where: { 
      id: requestId,
      companyId 
    }
  });
  
  if (!req) {
    throw new Error('Leave Request not found or unauthorized access');
  }
  return true;
}

export async function getLeaveHistory(employeeId: string) {
  return prisma.leaveRequest.findMany({
    where: { employeeId },
    include: {
      leaveType: true,
      approvals: true
    },
    orderBy: { createdAt: 'desc' }
  });
}
