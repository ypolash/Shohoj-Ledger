import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";
import { requireModule } from "@/lib/modules/moduleGuard";
import { getSession } from "@/lib/session";

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
