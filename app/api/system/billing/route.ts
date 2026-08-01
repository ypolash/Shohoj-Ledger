import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const invoices = await prisma.saaSInvoice.findMany({
      include: {
        company: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("GET System Billing Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, amount, dueDate, billingPeriodStart, billingPeriodEnd } = await req.json();

    if (!companyId || amount === undefined || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const invoice = await prisma.saaSInvoice.create({
      data: {
        invoiceNumber,
        companyId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : null,
        billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : null,
      }
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("POST System Billing Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { invoiceId, status } = await req.json();
    if (!invoiceId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const invoice = await prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: { status }
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("PATCH System Billing Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
