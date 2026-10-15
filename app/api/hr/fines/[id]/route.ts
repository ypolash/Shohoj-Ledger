import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    if (!params.id) {
      return NextResponse.json({ error: "Fine ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { status, amount, reason } = body;

    const fine = await prisma.employeeFine.findUnique({
      where: { id: params.id, companyId }
    });

    if (!fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status) {
      if (!["PENDING", "CANCELLED", "DEDUCTED", "CONSIDERATION_REQUESTED", "WAIVED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      dataToUpdate.status = status;
    }
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 });
      }
      dataToUpdate.amount = numAmount;
    }
    if (reason !== undefined) {
      dataToUpdate.reason = String(reason).trim();
    }

    const updatedFine = await prisma.employeeFine.update({
      where: { id: params.id },
      data: dataToUpdate
    });

    // Sync with active payroll so reducing or waiving fines immediately updates net salary
    const oldFineEffective = fine.status === 'CANCELLED' ? 0 : Number(fine.amount);
    const newFineEffective = (dataToUpdate.status === 'CANCELLED')
      ? 0
      : (dataToUpdate.amount !== undefined ? Number(dataToUpdate.amount) : oldFineEffective);
    const diff = newFineEffective - oldFineEffective;

    if (diff !== 0) {
      let activePayment = null;
      if (body.payrollId) {
        activePayment = await prisma.salaryPayment.findFirst({
          where: { id: body.payrollId, companyId: companyId! }
        });
      }
      if (!activePayment) {
        const fineDate = new Date(fine.date || fine.createdAt);
        const month = fineDate.getMonth() + 1;
        const year = fineDate.getFullYear();

        activePayment = await prisma.salaryPayment.findFirst({
          where: {
            companyId: companyId!,
            employeeId: fine.employeeId,
            month,
            year,
            status: { in: ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'] }
          }
        });
      }

      if (activePayment) {
        const newNet = Math.max(0, Number(activePayment.netSalary) - diff);
        await prisma.salaryPayment.update({
          where: { id: activePayment.id },
          data: { netSalary: newNet }
        });
      }
    }

    // Two-way sync: Update matching Attendance record if this fine is related to late arrival
    if (fine.employeeId && (fine.reason || "").toLowerCase().includes("late")) {
      try {
        const fineDate = new Date(fine.date || fine.createdAt);
        const startOfDay = new Date(fineDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fineDate);
        endOfDay.setHours(23, 59, 59, 999);

        const targetAtt = await prisma.attendance.findFirst({
          where: {
            employeeId: fine.employeeId,
            date: { gte: startOfDay, lte: endOfDay }
          }
        });

        if (targetAtt) {
          const isCancelled = updatedFine.status === 'CANCELLED';
          await prisma.attendance.update({
            where: { id: targetAtt.id },
            data: {
              punishmentAmount: isCancelled ? 0 : Number(updatedFine.amount),
              reviewStatus: isCancelled ? 'CONSIDERED' : targetAtt.reviewStatus,
            }
          });
        }
      } catch (attSyncErr) {
        console.warn("Sync to attendance on fine PATCH error:", attSyncErr);
      }
    }

    return NextResponse.json({ fine: updatedFine });
  } catch (error) {
    console.error("PATCH Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const params = await props.params;
    if (!params.id) {
      return NextResponse.json({ error: "Fine ID is required" }, { status: 400 });
    }

    const fine = await prisma.employeeFine.findUnique({
      where: { id: params.id, companyId }
    });

    if (!fine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    // Sync with active payroll before deleting fine
    if (fine.status !== 'CANCELLED') {
      const url = new URL(request.url);
      const payrollId = url.searchParams.get('payrollId');
      let activePayment = null;
      if (payrollId) {
        activePayment = await prisma.salaryPayment.findFirst({
          where: { id: payrollId, companyId: companyId! }
        });
      }
      if (!activePayment) {
        const fineDate = new Date(fine.date || fine.createdAt);
        const month = fineDate.getMonth() + 1;
        const year = fineDate.getFullYear();

        activePayment = await prisma.salaryPayment.findFirst({
          where: {
            companyId: companyId!,
            employeeId: fine.employeeId,
            month,
            year,
            status: { in: ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'] }
          }
        });
      }

      if (activePayment) {
        const newNet = Number(activePayment.netSalary) + Number(fine.amount);
        await prisma.salaryPayment.update({
          where: { id: activePayment.id },
          data: { netSalary: newNet }
        });
      }
    }

    // Two-way sync: Reset Attendance fine amount if this fine was related to late arrival
    if (fine.employeeId && (fine.reason || "").toLowerCase().includes("late")) {
      try {
        const fineDate = new Date(fine.date || fine.createdAt);
        const startOfDay = new Date(fineDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fineDate);
        endOfDay.setHours(23, 59, 59, 999);

        await prisma.attendance.updateMany({
          where: {
            employeeId: fine.employeeId,
            date: { gte: startOfDay, lte: endOfDay }
          },
          data: {
            punishmentAmount: 0,
            reviewStatus: 'CONSIDERED'
          }
        });
      } catch (attSyncErr) {
        console.warn("Sync to attendance on fine DELETE error:", attSyncErr);
      }
    }

    await prisma.employeeFine.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
