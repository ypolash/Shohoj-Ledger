import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from "@/lib/company/companyFilter";

export async function GET(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    const [bonuses, employees] = await Promise.all([
      prisma.bonus.findMany({
        where: { companyId, month, year },
        include: {
          employee: {
            include: { departmentRef: true, designationRef: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeId: true }
      })
    ]);

    const totalBonus = bonuses.reduce((acc, b) => acc + Number(b.amount), 0);

    return NextResponse.json({
      bonuses,
      employees,
      stats: {
        totalBonus,
        count: bonuses.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch bonuses:', error);
    return NextResponse.json({ error: 'Failed to fetch bonuses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { employeeId, month, year, type, amount, reason } = body;

    if (!employeeId || !amount) {
      return NextResponse.json({ error: 'Employee and bonus amount required' }, { status: 400 });
    }

    const bonus = await prisma.bonus.create({
      data: {
        companyId,
        employeeId,
        month: Number(month) || new Date().getMonth() + 1,
        year: Number(year) || new Date().getFullYear(),
        type: type || 'PERFORMANCE',
        amount: Number(amount),
        reason: reason || 'Special Performance Incentive'
      }
    });

    return NextResponse.json(bonus, { status: 201 });
  } catch (error) {
    console.error('Failed to create bonus:', error);
    return NextResponse.json({ error: 'Failed to create bonus' }, { status: 500 });
  }
}
