import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { requireModule } from "@/lib/modules/moduleGuard";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  try {
    const data = await request.json();
    const { status } = data;

    if (!['DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Role Checks based on transition
    if (status === 'APPROVED') {
      const rbacGuard = await requirePermission("PAYROLL_APPROVE");
      if (rbacGuard) return rbacGuard;
    } else if (status === 'PAID') {
      const rbacGuard = await requirePermission("PAYROLL_PAY");
      if (rbacGuard) return rbacGuard;
    } else {
      const rbacGuard = await requirePermission("PAYROLL_GENERATE");
      if (rbacGuard) return rbacGuard;
    }

    const existingPayment = await prisma.salaryPayment.findUnique({
      where: { ...companyFilter, id },
      include: { employee: true }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    if (existingPayment.status === 'PAID' && status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot modify a paid payroll' }, { status: 400 });
    }

    // If transitioning to PAID, create the expense
    let expenseId = existingPayment.expenseId;
    if (status === 'PAID' && !expenseId) {
      const expense = await prisma.expense.create({
        data: {
          companyId,
          category: 'Payroll',
          amount: existingPayment.netSalary,
          paymentMethod: 'Bank Transfer',
          approvalStatus: 'Approved',
          description: `Salary Payment for ${existingPayment.employee.firstName} ${existingPayment.employee.lastName} (${existingPayment.month}/${existingPayment.year})`
        }
      });
      expenseId = expense.id;
    }

    // If cancelling a PAID payroll, we should technically handle the expense, but we'll keep it simple or mark expense as rejected
    if (status === 'CANCELLED' && expenseId) {
       await prisma.expense.update({
          where: { id: expenseId },
          data: { approvalStatus: 'Cancelled' }
       });
    }

    const updatedPayment = await prisma.salaryPayment.update({
      where: { ...companyFilter, id },
      data: { 
        status,
        expenseId,
        ...(status === 'PAID' ? { paymentDate: new Date() } : {})
      }
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Failed to update payroll status:', error);
    return NextResponse.json({ error: 'Failed to update payroll status' }, { status: 500 });
  }
}
