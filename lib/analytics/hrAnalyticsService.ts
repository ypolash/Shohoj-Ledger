import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// EXECUTIVE DASHBOARDS
// ==========================================

export async function getExecutiveDashboard(companyId: string) {
  const [totalEmployees, activeEmployees, newHiresThisMonth, payrollSummary, loanSummary] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.employee.count({
      where: {
        companyId,
        joiningDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }
    }),
    getPayrollSummary(companyId),
    getLoanSummary(companyId)
  ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees: totalEmployees - activeEmployees,
    newHires: newHiresThisMonth,
    headcountGrowth: newHiresThisMonth / (activeEmployees || 1), // simplified
    payrollCost: payrollSummary.totalCost,
    outstandingLoans: loanSummary.totalOutstanding
  };
}

export async function getEmployeeDashboard(companyId: string) {
  const distribution = await getDepartmentDistribution(companyId);
  return { distribution };
}

export async function getRecruitmentDashboard(companyId: string) {
  const pipeline = await prisma.applicant.groupBy({
    by: ['status'],
    where: { jobOpening: { companyId } },
    _count: { _all: true }
  });
  return { pipeline };
}

export async function getAttendanceDashboard(companyId: string) {
  return getAttendanceStatistics(companyId);
}

export async function getLeaveDashboard(companyId: string) {
  return getLeaveStatistics(companyId);
}

export async function getPayrollDashboard(companyId: string) {
  return getPayrollSummary(companyId);
}

export async function getPerformanceDashboard(companyId: string) {
  return getPerformanceSummary(companyId);
}

export async function getTrainingDashboard(companyId: string) {
  return getTrainingSummary(companyId);
}

// ==========================================
// STATISTICAL ANALYSIS
// ==========================================

export async function getTurnoverAnalysis(companyId: string) {
  const terminations = await prisma.employee.count({
    where: { companyId, status: 'TERMINATED' } // Assuming TERMINATED status
  });
  return { terminations };
}

export async function getHeadcountTrend(companyId: string) {
  // Real-world: aggregate by month
  const active = await prisma.employee.count({ where: { companyId, status: 'ACTIVE' } });
  return { currentActive: active };
}

export async function getDepartmentDistribution(companyId: string) {
  return prisma.employee.groupBy({
    by: ['department'],
    where: { companyId, status: 'ACTIVE' },
    _count: { _all: true }
  });
}

export async function getLeaveStatistics(companyId: string) {
  const leaves = await prisma.leaveApproval.aggregate({
    where: { request: { companyId }, status: 'APPROVED' },
    _sum: {
      daysTaken: true
    }
  });
  return {
    totalDaysTaken: leaves._sum.daysTaken || 0
  };
}

export async function getAttendanceStatistics(companyId: string) {
  // Highly simplified. Real world needs to calculate based on expected vs actual shifts.
  const presentCount = await prisma.attendance.count({
    where: { companyId, isPresent: true }
  });
  const totalCount = await prisma.attendance.count({
    where: { companyId }
  });

  return {
    attendanceRate: totalCount > 0 ? presentCount / totalCount : 0
  };
}

export async function getOvertimeStatistics(companyId: string) {
  const ot = await prisma.attendanceOvertime.aggregate({
    where: { employee: { companyId }, status: 'APPROVED' },
    _sum: { approvedHours: true }
  });
  return { totalOvertimeHours: ot._sum.approvedHours || 0 };
}

// ==========================================
// FINANCIAL & OPERATIONS SUMMARIES
// ==========================================

export async function getPayrollSummary(companyId: string) {
  const latestRun = await prisma.payrollRun.findFirst({
    where: { companyId, status: 'POSTED' },
    orderBy: { createdAt: 'desc' },
    include: { snapshots: true }
  });

  if (!latestRun) return { totalCost: 0, averageSalary: 0 };

  const totalCost = latestRun.snapshots.reduce((sum: number, s: any) => sum + Number(s.netPay), 0);
  const averageSalary = latestRun.snapshots.length > 0 ? totalCost / latestRun.snapshots.length : 0;

  return { totalCost, averageSalary };
}

export async function getSalaryDistribution(companyId: string) {
  // Simplified grouping. Real world needs bucketized logic (e.g. 50k-60k)
  return prisma.employeeSalary.groupBy({
    by: ['amount'],
    where: { employee: { companyId } },
    _count: { _all: true }
  });
}

export async function getLoanSummary(companyId: string) {
  const loans = await prisma.employeeLoan.aggregate({
    where: { companyId, status: 'ACTIVE' },
    _sum: { outstandingBalance: true }
  });
  return { totalOutstanding: loans._sum.outstandingBalance || 0 };
}

export async function getAdvanceSummary(companyId: string) {
  const advances = await prisma.salaryAdvance.findMany({
    where: { companyId, status: 'ACTIVE' },
    include: { recoveries: true }
  });

  let outstanding = 0;
  for (const adv of advances) {
    const recovered = adv.recoveries.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    outstanding += (Number(adv.amount) - recovered);
  }

  return { totalOutstanding: outstanding };
}

export async function getPerformanceSummary(companyId: string) {
  const distribution = await prisma.performanceReview.groupBy({
    by: ['overallRating'],
    where: { cycle: { companyId }, status: 'APPROVED' },
    _count: { _all: true }
  });
  return { distribution };
}

export async function getTrainingSummary(companyId: string) {
  const completions = await prisma.trainingEnrollment.count({
    where: { session: { program: { companyId } }, status: 'COMPLETED' }
  });
  return { totalCompletions: completions };
}
