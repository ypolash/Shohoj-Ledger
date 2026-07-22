import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCompany } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyFilter = await withCompany();

    // 1. Total Employees
    const totalEmployees = await prisma.employee.count({
      where: companyFilter
    });

    // 2. Active Employees
    const activeEmployees = await prisma.employee.count({
      where: {
        ...companyFilter,
        employmentStatus: {
          notIn: ['Terminated', 'Resigned', 'Suspended']
        }
      }
    });

    // 3. Departments
    const departments = await prisma.department.count({
      where: {
        ...companyFilter,
        isActive: true
      }
    });

    // 4. New Hires (joined this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newHires = await prisma.employee.count({
      where: {
        ...companyFilter,
        joinDate: {
          gte: startOfMonth
        }
      }
    });

    // 5. Probation
    const probation = await prisma.employee.count({
      where: {
        ...companyFilter,
        employmentStatus: 'Probation'
      }
    });

    // 6. Resigned
    const resigned = await prisma.employee.count({
      where: {
        ...companyFilter,
        employmentStatus: 'Resigned'
      }
    });

    // 7. Terminated
    const terminated = await prisma.employee.count({
      where: {
        ...companyFilter,
        employmentStatus: 'Terminated'
      }
    });

    // 8. Upcoming Confirmations
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const upcomingConfirmations = await prisma.employee.count({
      where: {
        ...companyFilter,
        employmentStatus: 'Probation',
        joinDate: {
          lte: sixMonthsAgo
        }
      }
    });

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      departments,
      newHires,
      probation,
      resigned,
      terminated,
      upcomingConfirmations
    });
  } catch (error) {
    console.error("Error fetching HR overview metrics:", error);
    return NextResponse.json({ error: "Failed to fetch HR metrics" }, { status: 500 });
  }
}
