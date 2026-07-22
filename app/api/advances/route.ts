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
    const advances = await prisma.advance.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const userIds = advances.map(a => a.memberId);
    const members = await prisma.member.findMany({
      where: { ...(await withCompany()), id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = members.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    const advancesWithDetails = advances.map(adv => ({
      ...adv,
      memberName: userMap[adv.memberId] || "Unknown Member"
    }));

    return NextResponse.json(advancesWithDetails);
  } catch (error) {
    console.error("Error fetching advances:", error);
    return NextResponse.json({ error: "Failed to fetch advances" }, { status: 500 });
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
    const { memberId, amount, description } = body;

    if (!memberId || amount === undefined) {
      return NextResponse.json({ error: "Missing memberId or amount" }, { status: 400 });
    }

    const advanceAmount = parseFloat(amount);

    const advance = await prisma.advance.create({
      data: {
        companyId: companyIdForGuard,
        memberId,
        amount: advanceAmount,
        remainingAmount: advanceAmount,
        status: "ACTIVE",
        reason: description,
      }
    });

    const { createLedgerEntry } = await import("@/lib/ledger");
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Advance',
      referenceId: advance.id,
      amount: advanceAmount,
      isDebit: false, // Credit Bank (Asset decreases because we give cash to member)
      accountType: 'Advance', // Representing the receivable/cash out side
      description: `Advance Issued to Member: ${description || ''}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error("Error creating advance:", error);
    return NextResponse.json({ error: "Failed to issue advance" }, { status: 500 });
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updatedAdvance = await prisma.advance.update({
      where: { ...(await withCompany()), id },
      data: { status }
    });

    return NextResponse.json(updatedAdvance);
  } catch (error) {
    console.error("Error updating advance status:", error);
    return NextResponse.json({ error: "Failed to update advance status" }, { status: 500 });
  }
}
