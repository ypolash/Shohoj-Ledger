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
    const [rawLoans, employees] = await Promise.all([
      prisma.employeeLoan.findMany({
        where: { companyId },
        include: {
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

    const loans = rawLoans.map(l => ({
      ...l,
      amount: l.principalAmount,
      remainingAmount: l.outstandingBalance,
      monthlyEmi: l.installmentAmount,
      tenureMonths: l.installmentCount
    }));

    const totalLoaned = rawLoans.reduce((acc, l) => acc + Number(l.principalAmount), 0);
    const totalRemaining = rawLoans.reduce((acc, l) => acc + Number(l.outstandingBalance), 0);
    const activeLoans = rawLoans.filter(l => l.status === 'ACTIVE' && Number(l.outstandingBalance) > 0).length;

    return NextResponse.json({
      loans,
      employees,
      stats: {
        totalLoaned,
        totalRemaining,
        activeLoans
      }
    });
  } catch (error) {
    console.error('Failed to fetch employee loans:', error);
    return NextResponse.json({ error: 'Failed to fetch employee loans' }, { status: 500 });
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
    const { employeeId, amount, monthlyEmi, interestRate = 0, tenureMonths = 12, reason, loanType = 'PERSONAL' } = body;

    if (!employeeId || !amount) {
      return NextResponse.json({ error: 'Employee and loan amount are required' }, { status: 400 });
    }

    const loanNumber = `LN-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedAmount = Number(amount);
    const parsedTenure = Number(tenureMonths) || 12;
    const emi = Number(monthlyEmi || (parsedAmount / parsedTenure));

    const loan = await prisma.employeeLoan.create({
      data: {
        companyId,
        employeeId,
        loanNumber,
        loanType,
        principalAmount: parsedAmount,
        outstandingBalance: parsedAmount,
        installmentAmount: emi,
        installmentCount: parsedTenure,
        interestRate: Number(interestRate),
        status: 'ACTIVE',
        issueDate: new Date(),
      }
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Failed to create employee loan:', error);
    return NextResponse.json({ error: 'Failed to create employee loan' }, { status: 500 });
  }
}
