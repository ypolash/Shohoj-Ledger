import { PrismaClient } from '@prisma/client';
import { createSnapshot } from './payrollRunService';

const prisma = new PrismaClient();

export async function calculatePayroll(runId: string) {
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: runId },
    include: { period: true, company: true }
  });

  if (run.status !== 'DRAFT') {
    throw new Error('Cannot calculate a payroll run that is not in DRAFT status.');
  }

  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'CALCULATING' }
  });

  // 1. Fetch active employees
  const activeSalaries = await prisma.employeeSalary.findMany({
    where: { 
      structure: { companyId: run.companyId },
      status: 'ACTIVE' 
    },
    include: {
      employee: true,
      structure: { include: { components: true } }
    }
  });

  const snapshotPayload: any = { period: run.period, calculations: [] };

  for (const empSalary of activeSalaries) {
    let gross = 0;
    let allowances = 0;
    let deductions = 0;

    // A. Apply Salary Structure Components
    for (const comp of empSalary.structure.components) {
      const val = Number(comp.value);
      // Simplified math: FIXED amounts
      if (comp.type === 'EARNING') {
        allowances += val;
      } else {
        deductions += val;
      }
    }

    // B. Fetch Attendance Overtime (Phase 4 engine)
    const overtimes = await prisma.attendanceOvertime.findMany({
      where: {
        employeeId: empSalary.employeeId,
        status: 'APPROVED',
        attendance: { date: { gte: run.period.startDate, lte: run.period.endDate } }
      }
    });
    const otValue = overtimes.reduce((sum, ot) => sum + (Number(ot.hours) * Number(ot.rate)), 0);
    allowances += otValue;

    // C. Fetch Unpaid Leaves (Phase 5 engine)
    const unpaidLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: empSalary.employeeId,
        status: 'APPROVED',
        type: 'UNPAID',
        startDate: { gte: run.period.startDate }
      }
    });
    // Simplified deduction math per day
    const unpaidDeduction = unpaidLeaves.length * 100; 
    deductions += unpaidDeduction;

    gross = allowances; // Simplified gross formula
    const net = gross - deductions;

    // Write PayrollItem
    const item = await prisma.payrollItem.create({
      data: {
        payrollRunId: run.id,
        employeeId: empSalary.employeeId,
        grossSalary: gross,
        totalAllowances: allowances,
        totalDeductions: deductions,
        netSalary: net
      }
    });

    snapshotPayload.calculations.push({
      employeeId: empSalary.employeeId,
      gross, allowances, deductions, net,
      otValue, unpaidDeduction
    });
  }

  // 3. Save Immutable Snapshot
  await createSnapshot(run.id, snapshotPayload);

  await prisma.payrollRun.update({
    where: { id: runId },
    data: { status: 'REVIEW' }
  });

  return true;
}
