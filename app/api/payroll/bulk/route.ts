import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";
import { requireModule } from "@/lib/modules/moduleGuard";
import { getSession } from "@/lib/session";
import { calculatePayroll } from '@/lib/payroll';

// Handle Bulk Generation
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
    const { employeeIds, departmentId, month, year, workingDays } = data;
    
    if (!month || !year || !workingDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let targetEmployeeIds: string[] = [];

    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (departmentId) {
      const employeesInDept = await prisma.employee.findMany({
        where: { ...companyFilter, departmentId, status: 'ACTIVE' },
        select: { id: true }
      });
      targetEmployeeIds = employeesInDept.map(e => e.id);
    } else {
      const allActiveEmployees = await prisma.employee.findMany({
        where: { ...companyFilter, status: 'ACTIVE' },
        select: { id: true }
      });
      targetEmployeeIds = allActiveEmployees.map(e => e.id);
    }

    if (targetEmployeeIds.length === 0) {
      return NextResponse.json({ error: 'No employees found to generate payroll for' }, { status: 404 });
    }

    const results = {
      generated: 0,
      skipped: 0
    };

    // --- N+1 Query Optimization N+1: O(1) Pre-fetching ---
    // Fetch all necessary data outside the loop
    const existingPayments = await prisma.salaryPayment.findMany({
      where: { ...companyFilter, employeeId: { in: targetEmployeeIds }, month, year }
    });
    const existingEmpIds = new Set(existingPayments.map(p => p.employeeId));

    const employees = await prisma.employee.findMany({
      where: { ...companyFilter, id: { in: targetEmployeeIds } }
    });
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    const attendances = await prisma.attendance.findMany({
      where: { 
        ...companyFilter, 
        employeeId: { in: targetEmployeeIds }, 
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } 
      }
    });
    const attendanceMap = new Map<string, any[]>();
    attendances.forEach(a => {
      if (!attendanceMap.has(a.employeeId)) attendanceMap.set(a.employeeId, []);
      attendanceMap.get(a.employeeId)!.push(a);
    });

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { ...companyFilter, employeeId: { in: targetEmployeeIds }, startDate: { gte: new Date(year, month - 1, 1) } }
    });
    const leaveMap = new Map<string, any[]>();
    leaveRequests.forEach(l => {
      if (!leaveMap.has(l.employeeId)) leaveMap.set(l.employeeId, []);
      leaveMap.get(l.employeeId)!.push(l);
    });

    const bonuses = await prisma.bonus.findMany({
      where: { ...companyFilter, employeeId: { in: targetEmployeeIds }, month, year }
    });
    const bonusMap = new Map<string, any[]>();
    bonuses.forEach(b => {
      if (!bonusMap.has(b.employeeId)) bonusMap.set(b.employeeId, []);
      bonusMap.get(b.employeeId)!.push(b);
    });

    // --- Process Writes ---
    for (const empId of targetEmployeeIds) {
      if (existingEmpIds.has(empId)) {
        results.skipped++;
        continue;
      }

      const employee = employeeMap.get(empId);
      if (!employee) continue;

      const empAttendances = attendanceMap.get(empId) || [];
      const empLeaves = leaveMap.get(empId) || [];
      const empBonuses = bonusMap.get(empId) || [];

      const payroll = calculatePayroll(Number(employee.basicSalary), workingDays, empAttendances, empLeaves, empBonuses);

      const payment = await prisma.salaryPayment.create({
        data: {
          companyId: companyId!,
          employeeId: empId,
          month,
          year,
          basicSalary: payroll.basicSalary,
          grossSalary: payroll.grossSalary,
          netSalary: payroll.netSalary,
          status: 'DRAFT',
        }
      });

      for (const ded of payroll.deductions) {
        await prisma.salaryDeduction.create({
          data: { companyId: companyId!, employeeId: empId, month, year, type: ded.type, amount: ded.amount, reason: ded.reason }
        });
      }

      await prisma.payslip.create({
        data: {
          companyId: companyId!,
          employeeId: empId,
          month,
          year,
          totalEarnings: payroll.grossSalary,
          totalDeductions: payroll.totalDeductions,
          netPay: payroll.netSalary
        }
      });

      await prisma.payrollAudit.create({
        data: {
          companyId: companyId!,
          salaryPaymentId: payment.id,
          userId: userId,
          role: userRole,
          oldStatus: null,
          newStatus: 'DRAFT',
          remarks: 'Bulk payroll generated'
        }
      });
      
      results.generated++;
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Failed bulk generate:', error);
    return NextResponse.json({ error: 'Failed to process bulk payroll generation' }, { status: 500 });
  }
}

// Handle Bulk Workflow Transitions (Approve, Pay, Lock, Archive)
export async function PATCH(request: Request) {
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
    const { paymentIds, status, paymentMethod, transactionRef, paymentNote, remarks } = data;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json({ error: 'No payments selected' }, { status: 400 });
    }

    const validStatuses = ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED', 'PAID', 'LOCKED', 'ARCHIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Role Checks
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

    const results = {
      success: 0,
      failed: 0
    };

    for (const id of paymentIds) {
      const existingPayment = await prisma.salaryPayment.findUnique({
        where: { ...companyFilter, id },
        include: { employee: true }
      });

      if (!existingPayment) {
        results.failed++;
        continue;
      }

      if (existingPayment.status === 'LOCKED' && status !== 'ARCHIVED') {
        results.failed++;
        continue;
      }
      
      if (existingPayment.status === 'ARCHIVED') {
        results.failed++;
        continue;
      }

      if (existingPayment.status === 'PAID' && ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(status)) {
        results.failed++;
        continue;
      }

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
        await createLedgerEntry({
          companyId: companyId!,
          module: 'Payroll',
          referenceId: existingPayment.id,
          amount: Number(existingPayment.netSalary),
          isDebit: false, // Credit Bank (Asset decreases)
          accountType: paymentMethod || 'Bank Transfer',
          description: `Salary Payment for ${existingPayment.employee.firstName} ${existingPayment.employee.lastName} (${existingPayment.month}/${existingPayment.year})`,
          createdById: userId
        });
      }

      if (status === 'CANCELLED' && expenseId) {
         await prisma.expense.update({
            where: { id: expenseId },
            data: { approvalStatus: 'Cancelled' }
         });
      }

      await prisma.salaryPayment.update({
        where: { ...companyFilter, id },
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

      await prisma.payrollAudit.create({
        data: {
          companyId: companyId!,
          salaryPaymentId: id,
          userId: userId,
          role: userRole,
          oldStatus: existingPayment.status,
          newStatus: status,
          remarks: remarks || `Bulk status changed from ${existingPayment.status} to ${status}`
        }
      });
      
      results.success++;
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Failed to bulk process payroll:', error);
    return NextResponse.json({ error: 'Failed to process bulk payroll' }, { status: 500 });
  }
}
