import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePayroll } from '@/lib/payroll';
import { getSession } from '@/lib/session';
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("PAYROLL_GENERATE");
  if (rbacGuard) return rbacGuard;

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
    const { employeeId, month, year, workingDays, status = 'DRAFT', paymentMethod, transactionRef, paymentNote } = data;
    
    if (!employeeId || !month || !year || !workingDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if payroll already processed
    const existing = await prisma.salaryPayment.findFirst({
      where: { ...companyFilter, employeeId, month, year }
    });
    if (existing) {
      return NextResponse.json({ error: 'Payroll already generated for this month' }, { status: 400 });
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const employee = await prisma.employee.findFirst({ where: { companyId, id: employeeId, systemSource } });
    if (!employee) return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 404 });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 1. Fetch Attendances for the month
    const attendances = await prisma.attendance.findMany({
      where: { 
        ...companyFilter,
        employeeId,
        date: { gte: startDate, lt: endDate }
      }
    });

    // 2. Fetch Leaves
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { 
        ...companyFilter,
        employeeId,
        startDate: { gte: startDate }
      }
    });

    // 3. Fetch Bonuses
    const bonuses = await prisma.bonus.findMany({
      where: { ...companyFilter, employeeId, month, year }
    });

    // 4. Fetch Pending Fines (EmployeeFine)
    const fines = await prisma.employeeFine.findMany({
      where: {
        companyId,
        employeeId,
        status: 'PENDING'
      }
    });

    // 5. Fetch Active Salary Advances
    const rawAdvances = await prisma.salaryAdvance.findMany({
      where: {
        companyId,
        employeeId,
        status: 'APPROVED',
      },
      include: { recoveries: true }
    });
    const salaryAdvances = rawAdvances.map(a => {
      const recovered = (a.recoveries || []).reduce((sum, r) => sum + Number(r.amount), 0);
      const remainingAmount = Math.max(0, Number(a.amount) - recovered);
      return { ...a, remainingAmount };
    }).filter(a => a.remainingAmount > 0);

    // 6. Fetch Active Loans
    const rawLoans = await prisma.employeeLoan.findMany({
      where: {
        companyId,
        employeeId,
        status: 'ACTIVE',
        outstandingBalance: { gt: 0 }
      }
    });
    const employeeLoans = rawLoans.map(l => ({
      ...l,
      amount: l.principalAmount,
      remainingAmount: l.outstandingBalance,
      monthlyEmi: l.installmentAmount
    }));

    // 7. Fetch Approved Task Reward Submissions for the month
    const taskRewards = await prisma.taskRewardSubmission.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        createdAt: { gte: startDate, lt: endDate }
      },
      include: { taskReward: true }
    });

    // 8. Fetch Approved Overtime records
    const overtimes = await prisma.attendanceOvertime.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        attendance: {
          date: { gte: startDate, lt: endDate }
        }
      }
    });

    const payroll = calculatePayroll(
      Number(employee.basicSalary),
      workingDays,
      attendances,
      leaveRequests,
      bonuses,
      fines,
      salaryAdvances,
      employeeLoans,
      taskRewards,
      overtimes
    );

    let expenseId: string | null = null;

    // If initial status is PAID, generate the expense and ledger entry
    if (status === 'PAID') {
      const expense = await prisma.expense.create({
        data: {
          companyId: companyId!,
          category: 'Payroll',
          amount: payroll.netSalary,
          paymentMethod: paymentMethod || 'Bank Transfer',
          approvalStatus: 'Approved',
          description: `Salary Payment for ${employee.firstName} ${employee.lastName} (${month}/${year})${transactionRef ? ' | Ref: ' + transactionRef : ''}`,
          systemSource
        }
      });
      expenseId = expense.id;

      try {
        const { createLedgerEntry } = await import("@/lib/ledger");
        await createLedgerEntry({
          companyId: companyId!,
          module: 'Payroll',
          referenceId: expense.id,
          amount: Number(payroll.netSalary),
          isDebit: false,
          accountType: paymentMethod || 'Bank Transfer',
          description: `Salary Payment for ${employee.firstName} ${employee.lastName} (${month}/${year})`,
          createdById: userId
        });
      } catch (ledgerErr) {
        console.warn('Ledger entry creation skipped or optional:', ledgerErr);
      }

      // Mark fines as DEDUCTED
      for (const fine of fines) {
        await prisma.employeeFine.update({
          where: { id: fine.id },
          data: { status: 'DEDUCTED' }
        });
      }

      // Deduct from salary advances
      for (const adv of salaryAdvances) {
        const remAmt = Number(adv.remainingAmount || 0);
        if (remAmt > 0) {
          await prisma.salaryAdvanceRecovery.create({
            data: {
              advanceId: adv.id,
              amount: remAmt,
              recoveryDate: new Date(),
              payrollReference: `PAY-${month}-${year}`
            }
          });
          await prisma.salaryAdvance.update({
            where: { id: adv.id },
            data: { status: 'PAID' }
          });
        }
      }
    }

    // Save Payroll Record
    const payment = await prisma.salaryPayment.create({
      data: {
        companyId,
        employeeId,
        month,
        year,
        basicSalary: payroll.basicSalary,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        status: status,
        expenseId,
        paymentDate: status === 'PAID' ? new Date() : null,
        paymentMethod: status === 'PAID' ? (paymentMethod || 'Bank Transfer') : null,
        transactionRef: status === 'PAID' ? (transactionRef || null) : null,
        paymentNote: status === 'PAID' ? (paymentNote || null) : null
      }
    });

    // Clean up previous deductions for this employee & period if any
    await prisma.salaryDeduction.deleteMany({
      where: {
        employeeId,
        month,
        year
      }
    });

    // Save deductions breakdown
    for (const ded of payroll.deductions) {
      await prisma.salaryDeduction.create({
        data: {
          companyId,
          employeeId,
          month,
          year,
          type: ded.type,
          amount: ded.amount,
          reason: ded.reason
        }
      });
    }

    // Save or update Payslip
    await prisma.payslip.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month,
          year
        }
      },
      update: {
        totalEarnings: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netPay: payroll.netSalary,
        companyId,
        systemSource
      },
      create: {
        companyId,
        employeeId,
        month,
        year,
        totalEarnings: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netPay: payroll.netSalary,
        systemSource
      }
    });

    // Audit Logging
    await prisma.payrollAudit.create({
      data: {
        companyId,
        salaryPaymentId: payment.id,
        userId: userId,
        role: userRole,
        oldStatus: null,
        newStatus: status,
        remarks: 'Payroll generated with fine/advance/overtime deductions'
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Failed to generate payroll:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate payroll' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("PAYROLL_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const payments = await prisma.salaryPayment.findMany({
      where: { ...companyFilter, employee: { systemSource } },
      include: { 
        employee: {
          include: {
            departmentRef: true,
            designationRef: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate Summary Metrics for the given month/year
    const currentMonthPayments = payments.filter(p => p.month === month && p.year === year);
    
    let totalSalary = 0;
    let totalBonus = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let pendingCount = 0;
    let processedCount = 0;

    currentMonthPayments.forEach(p => {
      totalSalary += Number(p.basicSalary || 0);
      totalBonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      totalDeductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      totalNetPay += Number(p.netSalary || 0);

      if (p.status === 'PAID') {
        processedCount++;
      } else if (p.status !== 'CANCELLED') {
        pendingCount++;
      }
    });

    const summary = {
      currentMonth: `${month}/${year}`,
      totalSalary,
      totalBonus,
      totalDeductions,
      totalNetPay,
      pendingCount,
      processedCount
    };

    // Calculate Yearly Summary Metrics & Monthly Breakdown for the given year
    const currentYearPayments = payments.filter(p => p.year === year);
    let yearlySalary = 0;
    let yearlyBonus = 0;
    let yearlyDeductions = 0;
    let yearlyNetPay = 0;
    let yearlyPending = 0;
    let yearlyProcessed = 0;

    currentYearPayments.forEach(p => {
      yearlySalary += Number(p.basicSalary || 0);
      yearlyBonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
      yearlyDeductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
      yearlyNetPay += Number(p.netSalary || 0);

      if (p.status === 'PAID') {
        yearlyProcessed++;
      } else if (p.status !== 'CANCELLED') {
        yearlyPending++;
      }
    });

    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mPayments = currentYearPayments.filter(p => p.month === m);
      let mSalary = 0;
      let mBonus = 0;
      let mDeductions = 0;
      let mNet = 0;
      let mPending = 0;
      let mProcessed = 0;

      mPayments.forEach(p => {
        mSalary += Number(p.basicSalary || 0);
        mBonus += (Number(p.grossSalary || 0) - Number(p.basicSalary || 0));
        mDeductions += (Number(p.grossSalary || 0) - Number(p.netSalary || 0));
        mNet += Number(p.netSalary || 0);
        if (p.status === 'PAID') mProcessed++;
        else if (p.status !== 'CANCELLED') mPending++;
      });

      return {
        month: m,
        name: MONTH_LABELS[i],
        totalSalary: mSalary,
        totalBonus: mBonus,
        totalDeductions: mDeductions,
        totalNetPay: mNet,
        pendingCount: mPending,
        processedCount: mProcessed,
        totalRecords: mPayments.length,
      };
    });

    const yearlySummary = {
      year,
      totalSalary: yearlySalary,
      totalBonus: yearlyBonus,
      totalDeductions: yearlyDeductions,
      totalNetPay: yearlyNetPay,
      pendingCount: yearlyPending,
      processedCount: yearlyProcessed,
      totalRecords: currentYearPayments.length,
      monthlyBreakdown,
    };

    return NextResponse.json({ summary, yearlySummary, payments });
  } catch (error) {
    console.error("Failed to fetch payroll:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
