import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    const employeeId = params.id;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        basicSalary: true,
        designation: true,
        department: true,
        joinDate: true,
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const increments = await prisma.employeeLifecycle.findMany({
      where: {
        companyId,
        employeeId,
        eventType: 'SALARY_INCREMENT'
      },
      orderBy: { effectiveDate: 'desc' }
    });

    return NextResponse.json({
      employee: {
        ...employee,
        basicSalary: Number(employee.basicSalary || 0)
      },
      increments
    });
  } catch (error: any) {
    console.error("GET Salary Increments Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    const employeeId = params.id;

    const body = await request.json();
    const {
      incrementAmount,
      incrementPercentage,
      newBasicSalary,
      effectiveDate,
      reason,
      applyToCurrentPayroll,
      payrollId
    } = body;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const currentSalary = Number(employee.basicSalary || 0);
    let targetNewSalary = currentSalary;
    let actualIncrementAmount = 0;

    if (newBasicSalary !== undefined && Number(newBasicSalary) > 0) {
      targetNewSalary = Number(newBasicSalary);
      actualIncrementAmount = targetNewSalary - currentSalary;
    } else if (incrementAmount !== undefined && Number(incrementAmount) > 0) {
      actualIncrementAmount = Number(incrementAmount);
      targetNewSalary = currentSalary + actualIncrementAmount;
    } else if (incrementPercentage !== undefined && Number(incrementPercentage) > 0) {
      actualIncrementAmount = Math.round((currentSalary * Number(incrementPercentage)) / 100);
      targetNewSalary = currentSalary + actualIncrementAmount;
    } else {
      return NextResponse.json(
        { error: "Please specify a valid increment amount or percentage" },
        { status: 400 }
      );
    }

    if (actualIncrementAmount <= 0) {
      return NextResponse.json(
        { error: "New salary must be higher than current basic salary" },
        { status: 400 }
      );
    }

    const calcPercentage = currentSalary > 0
      ? Number(((actualIncrementAmount / currentSalary) * 100).toFixed(2))
      : 100;

    const effectiveDateObj = effectiveDate ? new Date(effectiveDate) : new Date();
    const incrementReason = String(reason || 'Annual performance salary increment').trim();

    // Perform database updates
    const [updatedEmployee, lifecycleEvent] = await prisma.$transaction([
      prisma.employee.update({
        where: { id: employeeId },
        data: { basicSalary: targetNewSalary }
      }),
      prisma.employeeLifecycle.create({
        data: {
          companyId,
          employeeId,
          eventType: 'SALARY_INCREMENT',
          effectiveDate: effectiveDateObj,
          description: incrementReason,
          previousData: {
            basicSalary: currentSalary
          },
          newData: {
            basicSalary: targetNewSalary,
            incrementAmount: actualIncrementAmount,
            incrementPercentage: calcPercentage,
            reason: incrementReason
          }
        }
      })
    ]);

    // Optional: Synchronize with active SalaryPayment (current month payroll)
    let updatedPayment: any = null;
    if (applyToCurrentPayroll !== false) {
      let targetPayment = null;
      if (payrollId) {
        targetPayment = await prisma.salaryPayment.findFirst({
          where: { id: payrollId, companyId }
        });
      }

      if (!targetPayment) {
        const month = effectiveDateObj.getMonth() + 1;
        const year = effectiveDateObj.getFullYear();
        targetPayment = await prisma.salaryPayment.findFirst({
          where: {
            companyId,
            employeeId,
            month,
            year,
            status: { in: ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'] }
          }
        });
      }

      if (targetPayment && ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(targetPayment.status)) {
        const oldPaymentBasic = Number(targetPayment.basicSalary || 0);
        const diff = targetNewSalary - oldPaymentBasic;

        if (diff > 0) {
          const newGross = Number(targetPayment.grossSalary || 0) + diff;
          const newNet = Number(targetPayment.netSalary || 0) + diff;

          updatedPayment = await prisma.salaryPayment.update({
            where: { id: targetPayment.id },
            data: {
              basicSalary: targetNewSalary,
              grossSalary: newGross,
              netSalary: newNet
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      oldSalary: currentSalary,
      newSalary: targetNewSalary,
      incrementAmount: actualIncrementAmount,
      incrementPercentage: calcPercentage,
      lifecycle: lifecycleEvent,
      employee: {
        ...updatedEmployee,
        basicSalary: Number(updatedEmployee.basicSalary)
      },
      updatedPayment
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST Salary Increment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grant salary increment" }, { status: 500 });
  }
}
