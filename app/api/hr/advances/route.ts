import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  try {
    const [rawAdvances, employees] = await Promise.all([
      prisma.salaryAdvance.findMany({
        where: { companyId },
        include: {
          recoveries: true,
          employee: {
            include: { departmentRef: true, designationRef: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeId: true, basicSalary: true }
      })
    ]);

    const salaryAdvances = rawAdvances.map((a) => {
      const recovered = (a.recoveries || []).reduce((sum, r) => sum + Number(r.amount), 0);
      const remainingAmount = Math.max(0, Number(a.amount) - recovered);
      return {
        ...a,
        remainingAmount,
        recoveredAmount: recovered,
      };
    });

    const totalAdvanced = salaryAdvances.reduce((acc, a) => acc + Number(a.amount), 0);
    const totalRemaining = salaryAdvances.reduce((acc, a) => acc + Number(a.remainingAmount), 0);
    const activeCount = salaryAdvances.filter(a => a.status === 'APPROVED' && Number(a.remainingAmount) > 0).length;

    return NextResponse.json({
      advances: salaryAdvances,
      employees,
      stats: {
        totalAdvanced,
        totalRemaining,
        activeCount
      }
    });
  } catch (error) {
    console.error('Failed to fetch salary advances:', error);
    return NextResponse.json({ error: 'Failed to fetch salary advances' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.user?.id;

  try {
    const body = await request.json();
    const { employeeId, amount, reason } = body;

    if (!employeeId || !amount) {
      return NextResponse.json({ error: 'Employee and advance amount required' }, { status: 400 });
    }

    const advanceNumber = `ADV-${Date.now().toString().slice(-6)}`;

    const advance = await prisma.salaryAdvance.create({
      data: {
        companyId,
        employeeId,
        advanceNumber,
        amount: Number(amount),
        recoveryMethod: 'PAYROLL',
        status: 'APPROVED',
        issueDate: new Date(),
      }
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error('Failed to create salary advance:', error);
    return NextResponse.json({ error: 'Failed to create salary advance' }, { status: 500 });
  }
}
