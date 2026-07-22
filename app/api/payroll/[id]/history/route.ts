import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany } from "@/lib/company/companyFilter";
import { requireModule } from "@/lib/modules/moduleGuard";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  const moduleGuard = await requireModule(companyId || "", "PAYROLL");
  if (moduleGuard) return moduleGuard;

  const rbacGuard = await requirePermission("PAYROLL_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const audits = await prisma.payrollAudit.findMany({
      where: { ...companyFilter, salaryPaymentId: id },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error('Failed to fetch payroll history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
