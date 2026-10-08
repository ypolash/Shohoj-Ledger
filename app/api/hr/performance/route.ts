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
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const [reviews, goals, pips, employees] = await Promise.all([
      prisma.performanceReview.findMany({
        where: {
          employee: { companyId },
          ...(employeeId ? { employeeId } : {})
        },
        include: {
          employee: {
            include: { departmentRef: true, designationRef: true }
          },
          reviewer: true,
          cycle: true
        },
        orderBy: { reviewDate: 'desc' }
      }),
      prisma.performanceGoal.findMany({
        where: {
          employee: { companyId },
          ...(employeeId ? { employeeId } : {})
        },
        include: {
          employee: true,
          cycle: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.performanceImprovementPlan.findMany({
        where: {
          employee: { companyId },
          ...(employeeId ? { employeeId } : {})
        },
        include: {
          employee: true,
          cycle: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true }
      })
    ]);

    // KPI Summary
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.overallRating) || 0), 0) / totalReviews).toFixed(1)
      : '0.0';
    const activeGoals = goals.filter(g => g.status === 'ACTIVE' || g.status === 'IN_PROGRESS').length;
    const achievedGoals = goals.filter(g => g.status === 'ACHIEVED').length;
    const activePips = pips.filter(p => p.status === 'ACTIVE').length;

    return NextResponse.json({
      reviews,
      goals,
      pips,
      employees,
      stats: {
        totalReviews,
        avgRating,
        activeGoals,
        achievedGoals,
        activePips
      }
    });
  } catch (error) {
    console.error('Failed to fetch performance data:', error);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
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
    const { action } = body;

    // Helper: Ensure an active cycle exists
    let cycle = await prisma.performanceCycle.findFirst({
      where: { companyId, status: 'ACTIVE' }
    });
    if (!cycle) {
      const year = new Date().getFullYear();
      cycle = await prisma.performanceCycle.create({
        data: {
          companyId,
          name: `Performance Cycle ${year}`,
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31),
          status: 'ACTIVE'
        }
      });
    }

    // 1. Create Performance Review
    if (action === 'CREATE_REVIEW') {
      const { employeeId, reviewerId, overallRating, comments, feedback, status = 'COMPLETED' } = body;
      if (!employeeId || !reviewerId || !overallRating) {
        return NextResponse.json({ error: 'Employee, reviewer, and rating are required' }, { status: 400 });
      }

      const review = await prisma.performanceReview.create({
        data: {
          employeeId,
          reviewerId,
          cycleId: cycle.id,
          reviewDate: new Date(),
          overallRating: Number(overallRating),
          comments: comments || feedback || null,
          status
        }
      });
      return NextResponse.json(review, { status: 201 });
    }

    // 2. Create Goal
    if (action === 'CREATE_GOAL') {
      const { employeeId, title, goal: goalText, description, weight = 10, target } = body;
      const finalGoal = title || goalText;
      if (!employeeId || !finalGoal) {
        return NextResponse.json({ error: 'Employee and goal title are required' }, { status: 400 });
      }

      const goal = await prisma.performanceGoal.create({
        data: {
          employeeId,
          cycleId: cycle.id,
          goal: finalGoal,
          target: target || description || null,
          weight: Number(weight),
          status: 'ACTIVE'
        }
      });
      return NextResponse.json(goal, { status: 201 });
    }

    // 3. Update Goal Progress
    if (action === 'UPDATE_GOAL') {
      const { goalId, status } = body;
      if (!goalId) {
        return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
      }

      const updated = await prisma.performanceGoal.update({
        where: { id: goalId },
        data: {
          status: status || 'ACHIEVED'
        }
      });
      return NextResponse.json(updated);
    }

    // 4. Create Performance Improvement Plan (PIP)
    if (action === 'CREATE_PIP') {
      const { employeeId, endDate, targetDate, objectives, actions } = body;
      const finalTargetDate = targetDate || endDate;
      if (!employeeId || !finalTargetDate || !objectives) {
        return NextResponse.json({ error: 'Employee, target date, and objectives required' }, { status: 400 });
      }

      const pip = await prisma.performanceImprovementPlan.create({
        data: {
          employeeId,
          cycleId: cycle.id,
          objectives,
          actions: actions || objectives,
          targetDate: new Date(finalTargetDate),
          status: 'ACTIVE'
        }
      });
      return NextResponse.json(pip, { status: 201 });
    }

    return NextResponse.json({ error: 'Unknown performance action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process performance action:', error);
    return NextResponse.json({ error: 'Failed to process performance action' }, { status: 500 });
  }
}
