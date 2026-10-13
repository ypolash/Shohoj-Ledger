import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const fines = await prisma.employeeFine.findMany({
      where: { companyId, systemSource },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true }
        },
        payrollRun: {
          select: { period: { select: { name: true } } }
        }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json({ fines });
  } catch (error) {
    console.error("GET Fines Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const body = await req.json();
    const { employeeId, amount, reason, date } = body;

    if (!employeeId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fine = await prisma.employeeFine.create({
      data: {
        companyId,
        employeeId,
        amount: Number(amount),
        reason,
        date: date ? new Date(date) : new Date(),
        status: "PENDING",
        systemSource
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true, userId: true }
        }
      }
    });

    // Create in-app Notification record if employee has linked user account
    if (fine.employee?.userId) {
      try {
        await prisma.notification.create({
          data: {
            companyId,
            userId: fine.employee.userId,
            category: "FINE",
            title: `Disciplinary Fine: ৳${Number(amount)}`,
            message: `A penalty fine of ৳${Number(amount)} has been imposed: ${reason}`,
            channel: "IN_APP",
            status: "UNREAD",
            priority: "HIGH",
          }
        });
      } catch (notifErr) {
        console.warn("Failed to create in-app notification record:", notifErr);
      }
    }

    // Sync with active payroll so new fine immediately deducts from net salary
    const targetDate = date ? new Date(date) : new Date();
    const activePayment = await prisma.salaryPayment.findFirst({
      where: {
        companyId: companyId!,
        employeeId,
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        status: { in: ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'] }
      }
    });

    if (activePayment) {
      const newNet = Math.max(0, Number(activePayment.netSalary) - Number(amount));
      await prisma.salaryPayment.update({
        where: { id: activePayment.id },
        data: { netSalary: newNet }
      });
    }

    return NextResponse.json({ fine });
  } catch (error) {
    console.error("POST Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
