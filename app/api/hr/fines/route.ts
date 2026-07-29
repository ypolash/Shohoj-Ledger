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
          select: { firstName: true, lastName: true, employeeId: true }
        }
      }
    });

    return NextResponse.json({ fine });
  } catch (error) {
    console.error("POST Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
