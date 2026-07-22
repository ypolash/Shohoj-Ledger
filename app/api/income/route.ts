import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireModule } from "@/lib/modules/moduleGuard";

import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("FINANCE_VIEW");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const incomes = await prisma.income.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
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
    const { category, source, amount, received, shareable, description, projectId } = body;

    if (!category || amount === undefined || received === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalAmount = parseFloat(amount);
    const receivedAmount = parseFloat(received);

    let paymentStatus = "UNPAID";
    if (receivedAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (receivedAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    const income = await prisma.income.create({
      data: {
        category,
        source,
        amount: totalAmount,
        received: receivedAmount,
        paymentStatus,
        shareable: shareable ?? true,
        description,
        projectId
      }
    });

    // Invalidate Settlement for this month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[new Date(income.createdAt).getMonth()];
    const yearName = new Date(income.createdAt).getFullYear();
    const period = `${monthName} ${yearName}`;
    await prisma.settlement.deleteMany({ where: { ...(await withCompany()), period } });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json({ error: "Failed to record income" }, { status: 500 });
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
      return NextResponse.json({ error: "Income ID is required" }, { status: 400 });
    }

    const income = await prisma.income.delete({
      where: { ...(await withCompany()), id }
    });

    // Invalidate Settlement for this month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[new Date(income.createdAt).getMonth()];
    const yearName = new Date(income.createdAt).getFullYear();
    const period = `${monthName} ${yearName}`;
    await prisma.settlement.deleteMany({ where: { ...(await withCompany()), period } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income:", error);
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rbacGuard = await requirePermission("FINANCE_MANAGE");
  if (rbacGuard) return rbacGuard;

  const companyIdForGuard = await getCompanyId();
  const moduleGuard = await requireModule(companyIdForGuard, "ACCOUNTING");
  if (moduleGuard) return moduleGuard;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Income ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { category, source, amount, received, shareable, description, projectId } = body;

    let updateData: any = { category, source, shareable, description, projectId };

    if (amount !== undefined && received !== undefined) {
      const totalAmount = parseFloat(amount);
      const receivedAmount = parseFloat(received);

      let paymentStatus = "UNPAID";
      if (receivedAmount >= totalAmount) {
        paymentStatus = "PAID";
      } else if (receivedAmount > 0) {
        paymentStatus = "PARTIAL";
      }

      updateData.amount = totalAmount;
      updateData.received = receivedAmount;
      updateData.paymentStatus = paymentStatus;
    }

    const income = await prisma.income.update({
      where: { ...(await withCompany()), id },
      data: updateData
    });

    // Invalidate Settlement for this month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[new Date(income.createdAt).getMonth()];
    const yearName = new Date(income.createdAt).getFullYear();
    const period = `${monthName} ${yearName}`;
    await prisma.settlement.deleteMany({ where: { ...(await withCompany()), period } });

    return NextResponse.json(income);
  } catch (error) {
    console.error("Error updating income:", error);
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 });
  }
}
