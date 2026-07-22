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
    const funds = await prisma.fundTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const totalFunds = funds.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return NextResponse.json({
      funds,
      totalFunds
    });
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json({ error: "Failed to fetch funds" }, { status: 500 });
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
    const { amount, source, description } = body;

    if (amount === undefined) {
      return NextResponse.json({ error: "Missing amount" }, { status: 400 });
    }

    const fundAmount = parseFloat(amount);

    const transaction = await prisma.fundTransaction.create({
      data: {
        companyId: companyIdForGuard,
        amount: fundAmount,
        source,
        description
      }
    });

    const { createLedgerEntry } = await import("@/lib/ledger");
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Fund',
      referenceId: transaction.id,
      amount: fundAmount,
      isDebit: true, // Fund coming in, Cash/Bank increases
      accountType: 'Fund',
      description: `Fund Added: ${source || ''} - ${description || ''}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating fund transaction:", error);
    return NextResponse.json({ error: "Failed to record fund transaction" }, { status: 500 });
  }
}
