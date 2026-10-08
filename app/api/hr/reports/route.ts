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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [employees, salaryPayments, attendances, leaveRequests, departments] = await Promise.all([
      prisma.employee.findMany({
        where: { companyId },
        include: {
          departmentRef: true,
          designationRef: true,
        },
        orderBy: { firstName: 'asc' }
      }),
      prisma.salaryPayment.findMany({
        where: { companyId, month, year },
        include: {
          employee: {
            include: { departmentRef: true, designationRef: true }
          }
        }
      }),
      prisma.attendance.findMany({
        where: {
          companyId,
          date: { gte: startDate, lt: endDate }
        }
      }),
      prisma.leaveRequest.findMany({
        where: {
          companyId,
          startDate: { gte: startDate, lt: endDate }
        }
      }),
      prisma.department.findMany({
        where: { companyId, isActive: true },
        include: {
          _count: { select: { employees: true } }
        }
      })
    ]);

    // 1. Master Salary Sheet
    const salarySheet = salaryPayments.map(p => ({
      id: p.id,
      employeeId: p.employee?.employeeId,
      name: `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`,
      department: p.employee?.departmentRef?.name || p.employee?.department || 'General',
      designation: p.employee?.designationRef?.name || p.employee?.designation || 'Staff',
      basicSalary: Number(p.basicSalary),
      grossSalary: Number(p.grossSalary),
      deductions: Number(p.grossSalary) - Number(p.netSalary),
      netSalary: Number(p.netSalary),
      status: p.status,
      paymentMethod: p.paymentMethod || 'Bank Transfer',
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—',
      transactionRef: p.transactionRef || '—'
    }));

    // 2. Attendance Master Analytics
    const attendanceSummary = employees.map(emp => {
      const empAtt = attendances.filter(a => a.employeeId === emp.id);
      const presentCount = empAtt.filter(a => a.status === 'PRESENT' || a.status === 'ON_TIME').length;
      const lateCount = empAtt.filter(a => a.status === 'LATE' || (a.lateMinutes && a.lateMinutes > 0)).length;
      const totalLateMins = empAtt.reduce((acc, a) => acc + (a.lateMinutes || 0), 0);
      const absentCount = empAtt.filter(a => a.status === 'ABSENT').length;
      const punishmentTotal = empAtt.reduce((acc, a) => acc + (Number(a.punishmentAmount) || 0), 0);

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.departmentRef?.name || emp.department || 'General',
        totalDaysRecorded: empAtt.length,
        presentDays: presentCount,
        lateDays: lateCount,
        totalLateMinutes: totalLateMins,
        absentDays: absentCount,
        penaltiesBDT: punishmentTotal
      };
    });

    // 3. Department Cost Distribution
    const departmentAnalytics = departments.map(d => {
      const deptEmployees = employees.filter(e => e.departmentId === d.id);
      const deptPayments = salaryPayments.filter(p => p.employee?.departmentId === d.id);
      const totalPayroll = deptPayments.reduce((acc, p) => acc + Number(p.netSalary), 0);
      const avgSalary = deptEmployees.length > 0 ? (totalPayroll / deptEmployees.length) : 0;

      return {
        id: d.id,
        departmentName: d.name,
        headcount: deptEmployees.length,
        totalPayrollDisbursed: totalPayroll,
        averageCompensation: avgSalary
      };
    });

    // 4. Overall Executive Summary
    const totalPayrollBurden = salaryPayments.reduce((acc, p) => acc + Number(p.netSalary), 0);
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;

    return NextResponse.json({
      period: `${month}/${year}`,
      totalPayrollBurden,
      totalEmployees,
      activeEmployees,
      salarySheet,
      attendanceSummary,
      departmentAnalytics
    });
  } catch (error) {
    console.error('Failed to generate HR reports:', error);
    return NextResponse.json({ error: 'Failed to generate HR reports' }, { status: 500 });
  }
}
