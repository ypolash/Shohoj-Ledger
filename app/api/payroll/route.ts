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
    const { employeeId, month, year, workingDays, status = 'DRAFT' } = data;
    
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

    const employee = await prisma.employee.findUnique({ where: { ...companyFilter, id: employeeId } });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    // Fetch Attendances for the month
    const attendances = await prisma.attendance.findMany({
      where: { ...companyFilter,
        employeeId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      }
    });

    // Fetch Leaves
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { ...companyFilter,
        employeeId,
        startDate: {
          gte: new Date(year, month - 1, 1),
        }
      }
    });

    // Fetch Bonuses
    const bonuses = await prisma.bonus.findMany({
      where: { ...companyFilter, employeeId, month, year }
    });

    const payroll = calculatePayroll(Number(employee.basicSalary), workingDays, attendances, leaveRequests, bonuses);

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
        status: status, // DRAFT, CALCULATED, APPROVED, PAID
        // expenseId is left null until PAID
      }
    });

    // Save deductions if any
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

    // Save Payslip
    await prisma.payslip.create({
      data: {
        companyId,
        employeeId,
        month,
        year,
        totalEarnings: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netPay: payroll.netSalary
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
        remarks: 'Payroll manually generated'
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Failed to generate payroll:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
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

    const payments = await prisma.salaryPayment.findMany({
      where: { ...companyFilter },
      include: { employee: true },
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
      totalSalary += Number(p.basicSalary);
      totalBonus += (Number(p.grossSalary) - Number(p.basicSalary));
      totalDeductions += (Number(p.grossSalary) - Number(p.netSalary));
      totalNetPay += Number(p.netSalary);

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

    return NextResponse.json({ summary, payments });
  } catch (error) {
    console.error("Failed to fetch payroll:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
