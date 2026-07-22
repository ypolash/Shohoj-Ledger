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
    const transactions = await prisma.reserveTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total reserve balance
    const totalReserve = transactions.reduce((acc, curr) => {
      const amt = Number(curr.amount);
      return curr.type === "DEPOSIT" ? acc + amt : acc - amt;
    }, 0);

    return NextResponse.json({
      transactions,
      totalReserve
    });
  } catch (error) {
    console.error("Error fetching reserve transactions:", error);
    return NextResponse.json({ error: "Failed to fetch reserve data" }, { status: 500 });
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
    const { amount, type, description } = body;

    if (amount === undefined || !type) {
      return NextResponse.json({ error: "Missing amount or type" }, { status: 400 });
    }

    const transactionAmount = parseFloat(amount);

    const transaction = await prisma.reserveTransaction.create({
      data: {
        companyId: companyIdForGuard,
        amount: transactionAmount,
        type, // "DEPOSIT" or "WITHDRAWAL"
        reason: description // NOTE: schema uses `reason` instead of `description`! Let me fix this mapping.
      }
    });

    const { createLedgerEntry } = await import("@/lib/ledger");
    const { getSession } = await import("@/lib/session");
    const session = await getSession();

    await createLedgerEntry({
      companyId: companyIdForGuard,
      module: 'Reserve',
      referenceId: transaction.id,
      amount: transactionAmount,
      isDebit: type === 'WITHDRAWAL', // If withdrawing from reserve, cash/bank receives money (Asset +)
      accountType: 'Reserve',
      description: `Reserve ${type}: ${description || ''}`,
      createdById: session?.user?.id
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating reserve transaction:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
