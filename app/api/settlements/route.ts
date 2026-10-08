import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/calculations";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  try {
    const rbacGuard = await requirePermission("FINANCE_VIEW");
    if (rbacGuard) return rbacGuard;

    const companyIdForGuard = await getCompanyId();
    const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
    if (moduleGuard) return moduleGuard;

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || "");
    const year = parseInt(url.searchParams.get("year") || "");

    const referer = request.headers.get("referer") || "";
    const isErp = referer.includes("/erp");
    const systemSource = isErp ? "ERP" : "LEGACY";
    const systemSourceCondition = isErp ? { in: ["ERP", "ERP_CRM"] } : { in: ["LEGACY", "ERP_CRM"] };

    if (isNaN(month) || isNaN(year)) {
      // Fetch all settlements
      const settlements = await prisma.settlement.findMany({
        where: { ...(await withCompany()), systemSource },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(settlements);
    }

    // PREVIEW CALCULATION for a specific month/year with exact boundaries
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const incomes = await prisma.income.findMany({
      where: { 
        ...(await withCompany()),
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        shareable: true,
        systemSource: systemSourceCondition
      }
    });

    const expenses = await prisma.expense.findMany({
      where: { 
        ...(await withCompany()),
        createdAt: { gte: startDate, lte: endDate },
        approvalStatus: { in: ["APPROVED", "Approved"] },
        systemSource: systemSourceCondition
      }
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.received || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const netProfit = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Use unified profit distribution engine with loss protection
    const shares = calculateSettlement(netProfit, 'General');

    return NextResponse.json({
      period: `${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
      ceoShare: shares.ceo,
      developerShare: shares.developer,
      advisorShare: shares.advisor,
      companyShare: shares.company
    });
  } catch (error) {
    console.error("Error with settlements GET:", error);
    return NextResponse.json({ error: "Failed to process settlement request" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { period, totalIncome, totalExpenses, ceoShare, developerShare, advisorShare, companyShare } = body;

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    // Check if an executed settlement already exists for this period
    const existing = await prisma.settlement.findFirst({
      where: { companyId: companyIdForGuard, period, systemSource }
    });

    if (existing && existing.status === 'EXECUTED') {
      return NextResponse.json({ error: "A finalized settlement already exists for this period and cannot be overwritten." }, { status: 400 });
    }

    // Delete existing pending settlement for clean regeneration
    if (existing && existing.status === 'PENDING') {
      await prisma.settlement.delete({ where: { id: existing.id } });
    }

    const settlement = await prisma.settlement.create({
      data: {
        companyId: companyIdForGuard,
        period,
        totalIncome: Number(totalIncome),
        totalExpenses: Number(totalExpenses),
        ceoShare: Number(ceoShare),
        developerShare: Number(developerShare),
        advisorShare: Number(advisorShare),
        companyShare: Number(companyShare),
        status: "PENDING",
        systemSource
      }
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Error creating settlement:", error);
    return NextResponse.json({ error: "Failed to record settlement" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== "EXECUTE") {
      return NextResponse.json({ error: "Invalid execution request" }, { status: 400 });
    }

    const referer = request.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const settlement = await prisma.settlement.findFirst({ where: { ...(await withCompany()), id, systemSource } });
    if (!settlement || settlement.status !== "PENDING") {
      return NextResponse.json({ error: "Settlement not found or already executed" }, { status: 400 });
    }

    // Execute the settlement within a transaction
    const [updatedSettlement] = await prisma.$transaction([
      // 1. Mark Settlement as Executed
      prisma.settlement.update({
        where: { id },
        data: { status: "EXECUTED" }
      }),
      // 2. Auto-transfer the positive Company portion to the Reserve Balance
      ...(Number(settlement.companyShare) > 0 ? [
        prisma.reserveTransaction.create({
          data: {
            companyId: companyIdForGuard,
            type: "DEPOSIT",
            amount: settlement.companyShare,
            reason: `Auto-deposit from ${settlement.period} Settlement`,
            systemSource
          }
        })
      ] : [])
    ]);

    return NextResponse.json(updatedSettlement);
  } catch (error) {
    console.error("Error executing settlement:", error);
    return NextResponse.json({ error: "Failed to execute settlement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Settlement ID is required" }, { status: 400 });
    }

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const settlement = await prisma.settlement.findFirst({ where: { ...(await withCompany()), id, systemSource } });
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    if (settlement.status === "EXECUTED") {
      return NextResponse.json({ error: "Cannot delete an executed settlement record. Reversal voucher required." }, { status: 400 });
    }

    await prisma.settlement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting settlement:", error);
    return NextResponse.json({ error: "Failed to delete settlement" }, { status: 500 });
  }
}
