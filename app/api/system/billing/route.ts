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
  } catch (error: any) {
    console.error("GET System Billing Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, amount, dueDate, billingPeriodStart, billingPeriodEnd, status = "PENDING" } = await req.json();

    if (!companyId || amount === undefined || !dueDate) {
      return NextResponse.json({ error: "Missing required fields (companyId, amount, dueDate)" }, { status: 400 });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randSuffix}`;

    const invoice = await prisma.saaSInvoice.create({
      data: {
        invoiceNumber,
        companyId,
        amount: parseFloat(amount),
        status,
        dueDate: new Date(dueDate),
        billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : null,
        billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : null,
      },
      include: {
        company: true
      }
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    console.error("POST System Billing Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { invoiceId, status, amount, dueDate } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const invoice = await prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        company: true
      }
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("PATCH System Billing Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    await prisma.saaSInvoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error: any) {
    console.error("DELETE System Billing Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
