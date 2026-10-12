import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";
import { requireModule } from "@/lib/modules/moduleGuard";
import { getSession } from "@/lib/session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  const rbacGuard = await requirePermission("PAYROLL_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const payment = await prisma.salaryPayment.findFirst({
      where: { ...companyFilter, id },
      include: {
        employee: {
          include: {
            departmentRef: true,
            designationRef: true
          }
        },
        audits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    const { employeeId, month, year } = payment;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 1. Fetch all attendances for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        ...companyFilter,
        employeeId,
        date: { gte: startDate, lt: endDate }
      },
      orderBy: { date: 'asc' }
    });

    // 2. Fetch leave requests
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        ...companyFilter,
        employeeId,
        OR: [
          { startDate: { gte: startDate, lt: endDate } },
          { endDate: { gte: startDate, lt: endDate } }
        ]
      },
      orderBy: { startDate: 'desc' }
    });

    // 3. Fetch employee fines (all fines recorded in this period or pending/deducted)
    const fines = await prisma.employeeFine.findMany({
      where: {
        companyId: companyId!,
        employeeId,
        OR: [
          { date: { gte: startDate, lt: endDate } },
          { createdAt: { gte: startDate, lt: endDate } }
        ]
      },
      orderBy: { date: 'desc' }
    });

    // 4. Fetch bonuses
    const bonuses = await prisma.bonus.findMany({
      where: {
        ...companyFilter,
        employeeId,
        month,
        year
      },
      orderBy: { createdAt: 'desc' }
    });

    // 5. Fetch calculated salary deductions
    const deductions = await prisma.salaryDeduction.findMany({
      where: {
        companyId: companyId!,
        employeeId,
        month,
        year
      },
      orderBy: { createdAt: 'asc' }
    });

    // 6. Fetch task rewards
    const taskRewards = await prisma.taskRewardSubmission.findMany({
      where: {
        employeeId,
        createdAt: { gte: startDate, lt: endDate }
      },
      include: {
        taskReward: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 7. Fetch overtimes
    const overtimes = await prisma.attendanceOvertime.findMany({
      where: {
        employeeId,
        attendance: {
          date: { gte: startDate, lt: endDate }
        }
      },
      include: {
        attendance: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 8. Fetch active salary advances & recoveries
    const salaryAdvances = await prisma.salaryAdvance.findMany({
      where: {
        companyId: companyId!,
        employeeId
      },
      include: {
        recoveries: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 9. Fetch employee loans
    const loans = await prisma.employeeLoan.findMany({
      where: {
        companyId: companyId!,
        employeeId
      },
      orderBy: { createdAt: 'desc' }
    });

    // Summarize telemetry metrics
    const presentRecords = attendances.filter(a => a.status === 'PRESENT');
    const absentRecords = attendances.filter(a => a.status === 'ABSENT');
    const lateRecords = attendances.filter(a => (a.lateMinutes && a.lateMinutes > 0) || a.status === 'LATE');
    const halfDayRecords = attendances.filter(a => a.status === 'HALF_DAY');
    const totalLateMinutes = lateRecords.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
    const totalPunishmentAmount = attendances.reduce((acc, curr) => acc + Number(curr.punishmentAmount || 0), 0);
    const totalFineAmount = fines.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalBonusAmount = bonuses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalTaskRewardAmount = taskRewards.reduce((acc, curr) => acc + Number(curr.rewardAmount || 0), 0);

    // 10. Fetch employee salary increment history
    const increments = await prisma.employeeLifecycle.findMany({
      where: {
        companyId: companyId!,
        employeeId,
        eventType: 'SALARY_INCREMENT'
      },
      orderBy: { effectiveDate: 'desc' }
    });

    return NextResponse.json({
      payment,
      telemetry: {
        totalAttendanceLogs: attendances.length,
        presentDays: presentRecords.length,
        absentDays: absentRecords.length,
        lateDays: lateRecords.length,
        halfDays: halfDayRecords.length,
        totalLateMinutes,
        totalPunishmentAmount,
        totalFineAmount,
        totalBonusAmount,
        totalTaskRewardAmount,
      },
      fines,
      attendances,
      absentRecords,
      lateRecords,
      leaves,
      bonuses,
      deductions,
      taskRewards,
      overtimes,
      salaryAdvances,
      loans,
      increments,
      audits: payment.audits || []
    });
  } catch (error) {
    console.error('Failed to fetch payroll review detail:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll review details' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  const session = await getSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role || 'user';

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (data.action === 'REDUCE_ATTENDANCE_PUNISHMENT') {
      const { attendanceId, newPunishmentAmount, reason } = data;
      const att = await prisma.attendance.findUnique({ where: { id: attendanceId } });
      if (!att) return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });

      const oldPunishment = Number(att.punishmentAmount || 0);
      const newPunishment = Math.max(0, Number(newPunishmentAmount || 0));
      const diff = newPunishment - oldPunishment;

      await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          punishmentAmount: newPunishment,
          punishmentReason: reason ? `${att.punishmentReason || ''} [Reduction: ${reason}]` : att.punishmentReason
        }
      });

      const existingPayment = await prisma.salaryPayment.findFirst({
        where: { companyId: companyId!, id }
      });

      if (existingPayment && ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(existingPayment.status)) {
        const newNet = Math.max(0, Number(existingPayment.netSalary) - diff);
        await prisma.salaryPayment.update({
          where: { id: existingPayment.id },
          data: { netSalary: newNet }
        });
      }

      return NextResponse.json({ success: true, newPunishmentAmount: newPunishment });
    }

    const { status, paymentMethod, transactionRef, paymentNote, remarks } = data;

    const validStatuses = ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED', 'PAID', 'LOCKED', 'ARCHIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Role Checks based on transition
    if (status === 'APPROVED') {
      const rbacGuard = await requirePermission("PAYROLL_APPROVE");
      if (rbacGuard) return rbacGuard;
    } else if (status === 'PAID') {
      const rbacGuard = await requirePermission("PAYROLL_PAY");
      if (rbacGuard) return rbacGuard;
    } else if (status === 'LOCKED') {
      const rbacGuard = await requirePermission("PAYROLL_LOCK");
      if (rbacGuard) return rbacGuard;
    } else if (status === 'ARCHIVED') {
      const rbacGuard = await requirePermission("PAYROLL_ARCHIVE");
      if (rbacGuard) return rbacGuard;
    } else {
      const rbacGuard = await requirePermission("PAYROLL_GENERATE");
      if (rbacGuard) return rbacGuard;
    }

    const existingPayment = await prisma.salaryPayment.findFirst({
      where: { companyId: companyId!, id },
      include: { employee: true }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    if (existingPayment.status === 'LOCKED' && status !== 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot modify a locked payroll' }, { status: 400 });
    }
    
    if (existingPayment.status === 'ARCHIVED') {
      return NextResponse.json({ error: 'Cannot modify an archived payroll' }, { status: 400 });
    }

    if (existingPayment.status === 'PAID' && ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(status)) {
      return NextResponse.json({ error: 'Cannot revert a paid payroll to an earlier state' }, { status: 400 });
    }

    // If transitioning to PAID, create the expense and ledger entry
    let expenseId = existingPayment.expenseId;
    if (status === 'PAID' && !expenseId) {
      const expense = await prisma.expense.create({
        data: {
          companyId: companyId!,
          category: 'Payroll',
          amount: existingPayment.netSalary,
          paymentMethod: paymentMethod || 'Bank Transfer',
          approvalStatus: 'Approved',
          description: `Salary Payment for ${existingPayment.employee.firstName} ${existingPayment.employee.lastName} (${existingPayment.month}/${existingPayment.year})${transactionRef ? ' | Ref: ' + transactionRef : ''}`
        }
      });
      expenseId = expense.id;

      const { createLedgerEntry } = await import("@/lib/ledger");
      try {
        await createLedgerEntry({
          companyId: companyId!,
          module: 'Payroll',
          referenceId: expense.id,
          amount: Number(existingPayment.netSalary),
          isDebit: false, // Credit Bank (Asset decreases)
          accountType: paymentMethod || 'Bank Transfer',
          description: `Salary Payment for ${existingPayment.employee.firstName} ${existingPayment.employee.lastName} (${existingPayment.month}/${existingPayment.year})`,
          createdById: userId
        });
      } catch (ledgerErr) {
        console.warn('Ledger entry creation skipped or optional:', ledgerErr);
      }

      // Mark pending fines as DEDUCTED
      await prisma.employeeFine.updateMany({
        where: {
          companyId: companyId!,
          employeeId: existingPayment.employeeId,
          status: 'PENDING'
        },
        data: { status: 'DEDUCTED' }
      });

      // Deduct from active salary advances
      const activeAdvances = await prisma.salaryAdvance.findMany({
        where: {
          companyId: companyId!,
          employeeId: existingPayment.employeeId,
          status: 'APPROVED',
        },
        include: { recoveries: true }
      });
      for (const adv of activeAdvances) {
        const recovered = (adv.recoveries || []).reduce((sum, r) => sum + Number(r.amount), 0);
        const rem = Math.max(0, Number(adv.amount) - recovered);
        if (rem > 0) {
          await prisma.salaryAdvanceRecovery.create({
            data: {
              advanceId: adv.id,
              amount: rem,
              recoveryDate: new Date(),
              payrollReference: `PAY-${existingPayment.id}`
            }
          });
          await prisma.salaryAdvance.update({
            where: { id: adv.id },
            data: { status: 'PAID' }
          });
        }
      }
    }

    // If cancelling a PAID payroll
    if (status === 'CANCELLED' && expenseId) {
       await prisma.expense.update({
          where: { id: expenseId },
          data: { approvalStatus: 'Cancelled' }
       });
    }

    const updatedPayment = await prisma.salaryPayment.update({
      where: { id },
      data: { 
        status,
        expenseId,
        ...(status === 'PAID' ? { 
          paymentDate: new Date(),
          paymentMethod: paymentMethod || 'Bank Transfer',
          transactionRef: transactionRef || null,
          paymentNote: paymentNote || null
        } : {})
      }
    });

    // Audit Logging
    await prisma.payrollAudit.create({
      data: {
        companyId: companyId!,
        salaryPaymentId: id,
        userId: userId,
        role: userRole,
        oldStatus: existingPayment.status,
        newStatus: status,
        remarks: remarks || `Status changed from ${existingPayment.status} to ${status}`
      }
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Failed to update payroll status:', error);
    return NextResponse.json({ error: 'Failed to update payroll status' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  const rbacGuard = await requirePermission("PAYROLL_MANAGE");
  if (rbacGuard) {
    const genGuard = await requirePermission("PAYROLL_GENERATE");
    if (genGuard) return rbacGuard;
  }

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingPayment = await prisma.salaryPayment.findFirst({
      where: { ...companyFilter, id },
      include: { employee: true }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    if (existingPayment.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot delete a locked payroll record' }, { status: 400 });
    }

    // Clean up associated expense if this payroll had been disbursed
    if (existingPayment.expenseId) {
      try {
        await prisma.expense.delete({
          where: { id: existingPayment.expenseId }
        });
      } catch (err) {
        console.warn('Associated expense deletion skipped or already removed:', err);
      }
    }

    // Delete audits for this salary payment
    await prisma.payrollAudit.deleteMany({
      where: { salaryPaymentId: id }
    });

    // Delete associated payslip for this employee and period
    await prisma.payslip.deleteMany({
      where: {
        employeeId: existingPayment.employeeId,
        month: existingPayment.month,
        year: existingPayment.year
      }
    });

    // Delete associated deductions for this employee and period
    await prisma.salaryDeduction.deleteMany({
      where: {
        employeeId: existingPayment.employeeId,
        month: existingPayment.month,
        year: existingPayment.year
      }
    });

    // Delete the salary payment
    await prisma.salaryPayment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Failed to delete payroll record:', error);
    return NextResponse.json({ error: 'Failed to delete payroll record' }, { status: 500 });
  }
}

