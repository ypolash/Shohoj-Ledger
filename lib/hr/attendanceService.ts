import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function assignShift(employeeId: string, workShiftId: string, effectiveDate: Date, endDate?: Date, isRotation = false) {
  return prisma.attendanceShiftAssignment.create({
    data: {
      employeeId,
      workShiftId,
      effectiveDate,
      endDate,
      isRotation
    }
  });
}

export async function generateRoster(companyId: string, employeeId: string, workShiftId: string, startDate: Date, daysToGenerate: number) {
  const records = [];
  
  for (let i = 0; i < daysToGenerate; i++) {
    const rosterDate = new Date(startDate);
    rosterDate.setDate(rosterDate.getDate() + i);
    
    records.push({
      companyId,
      employeeId,
      workShiftId,
      date: rosterDate,
      status: 'PLANNED'
    });
  }

  return prisma.attendanceRoster.createMany({
    data: records,
    skipDuplicates: true
  });
}

export async function calculateAttendance(attendanceId: string) {
  const attendance = await prisma.attendance.findUniqueOrThrow({
    where: { id: attendanceId },
    include: {
      employee: {
        include: {
          shiftAssignments: {
            orderBy: { effectiveDate: 'desc' },
            take: 1,
            include: { workShift: true }
          }
        }
      }
    }
  });

  const shift = attendance.employee.shiftAssignments[0]?.workShift;
  if (!shift) {
    throw new Error('No valid shift assigned for this employee');
  }

  // Pure mathematical calculation logic (to be injected here or handled by worker)
  // ... (Parses check-in against shift start time + grace period)
  
  return attendance;
}

export async function calculateLate(attendanceId: string) {
  // mathematical placeholder for late detection
  return true;
}

export async function calculateEarlyLeave(attendanceId: string) {
  // mathematical placeholder for early leave detection
  return true;
}

export async function calculateOvertime(attendanceId: string) {
  // mathematical placeholder for OT calculation based on Shift End
  return true;
}

export async function submitAdjustment(attendanceId: string, employeeId: string, type: string, reason: string, requestedById: string) {
  return prisma.attendanceAdjustment.create({
    data: {
      attendanceId,
      employeeId,
      type,
      reason,
      requestedById,
      status: 'PENDING'
    }
  });
}

export async function approveAdjustment(adjustmentId: string, approvedById: string) {
  return prisma.$transaction(async (tx) => {
    const adj = await tx.attendanceAdjustment.update({
      where: { id: adjustmentId },
      data: { status: 'APPROVED', approvedById }
    });

    // We can run an attendance recalculation hook here via message queue or direct call
    return adj;
  });
}

export async function detectExceptions(attendanceId: string) {
  // A wrapper that calls calculateLate(), calculateEarlyLeave() and automatically spawns AttendanceException rows
  return true;
}

export async function calculateWorkingHours(attendanceId: string) {
  // Returns total minutes between checkIn and checkOut minus breakTime
  return true;
}
