import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

/**
 * GET /api/inventory/purchases/[id]
 * Retrieves a single purchase order with complete details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PRODUCTS");
    if (rbacGuard) return rbacGuard;

    const purchase = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            contactPerson: true,
            supplierCode: true
          }
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                sku: true,
                unit: true
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase Order not found." }, { status: 404 });
    }

    return NextResponse.json({ purchase });
  } catch (error: any) {
    console.error("GET Purchase Detail Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
