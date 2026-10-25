import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        category: { select: { id: true, name: true } },
        purchaseOrders: {
          select: { id: true, poNumber: true, totalAmount: true, status: true, orderDate: true },
          orderBy: { orderDate: "desc" },
          take: 10
        },
        _count: { select: { purchaseOrders: true, goodsReceiptNotes: true } }
      }
    });

    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("GET Supplier Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const existing = await prisma.supplier.findFirst({
      where: { id, companyId }
    });
    if (!existing) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    const body = await req.json();
    const {
      name,
      logoUrl,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms,
      status,
      categoryId,
      taxNumber,
      currency
    } = body;

    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.supplier.findFirst({
        where: { companyId, name: name.trim(), id: { not: id } }
      });
      if (duplicate) return NextResponse.json({ error: "Another supplier with this name already exists" }, { status: 400 });
    }

    const updated = await (prisma.supplier as any).update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
        ...(contactPerson !== undefined && { contactPerson: contactPerson?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(paymentTerms !== undefined && { paymentTerms: paymentTerms?.trim() || null }),
        ...(taxNumber !== undefined && { taxNumber: taxNumber?.trim() || null }),
        ...(currency !== undefined && { currency: currency || "BDT" }),
        ...(status !== undefined && { status: status }),
        ...(categoryId !== undefined && { categoryId: categoryId || null })
      },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { purchaseOrders: true } }
      }
    });

    return NextResponse.json({ supplier: updated });
  } catch (error) {
    console.error("PUT Supplier Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("DELETE_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const existing = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: { _count: { select: { purchaseOrders: true, goodsReceiptNotes: true } } }
    });

    if (!existing) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

    // If purchase orders or goods receipt notes are attached, archive instead of hard delete
    if (existing._count.purchaseOrders > 0 || existing._count.goodsReceiptNotes > 0) {
      await prisma.supplier.update({
        where: { id },
        data: { status: "SUSPENDED", isActive: false }
      });
      return NextResponse.json({ 
        success: true, 
        message: "Supplier has purchase orders and was deactivated/suspended instead of deleted" 
      });
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Supplier Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
