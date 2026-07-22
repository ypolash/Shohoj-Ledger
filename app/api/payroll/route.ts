import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePayroll } from '@/lib/payroll';

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("PAYROLL_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "PAYROLL");
  if (moduleGuard) return moduleGuard;

  try {
    const data = await request.json();
    const { employeeId, month, year, workingDays } = data;
    
    if (!employeeId || !month || !year || !workingDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if payroll already processed
    const existing = await prisma.salaryPayment.findFirst({
      where: { ...(await withCompany()), employeeId, month, year }
    });
    if (existing) {
      return NextResponse.json({ error: 'Payroll already processed for this month' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({ where: { ...(await withCompany()), id: employeeId } });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    // Fetch Attendances for the month
    const attendances = await prisma.attendance.findMany({
      where: { ...(await withCompany()),
        employeeId,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
        }
      }
    });

    // Fetch Leaves
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { ...(await withCompany()),
        employeeId,
        startDate: {
          gte: new Date(year, month - 1, 1),
        }
      }
    });

    // Fetch Bonuses
    const bonuses = await prisma.bonus.findMany({
      where: { ...(await withCompany()), employeeId, month, year }
    });

    const payroll = calculatePayroll(Number(employee.basicSalary), workingDays, attendances, leaveRequests, bonuses);

    // Create Expense Record
    const expense = await prisma.expense.create({
      data: {
        category: 'Payroll',
        amount: payroll.netSalary,
        paymentMethod: 'Bank Transfer', // Default or UI provided
        approvalStatus: 'Approved',
        description: `Salary Payment for ${employee.firstName} ${employee.lastName} (${month}/${year})`
      }
    });

    // Save Payroll Record
    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId,
        month,
        year,
        basicSalary: payroll.basicSalary,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        status: 'PAID',
        expenseId: expense.id
      }
    });

    // Save deductions if any
    for (const ded of payroll.deductions) {
      await prisma.salaryDeduction.create({
        data: {
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
        employeeId,
        month,
        year,
        totalEarnings: payroll.grossSalary,
        totalDeductions: payroll.basicSalary - payroll.netSalary + payroll.grossSalary - payroll.basicSalary,
        netPay: payroll.netSalary
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Failed to process payroll:', error);
    return NextResponse.json({ error: 'Failed to process payroll' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const rbacGuard = await requirePermission("PAYROLL_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "PAYROLL");
  if (moduleGuard) return moduleGuard;

  try {
    const payments = await prisma.salaryPayment.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
