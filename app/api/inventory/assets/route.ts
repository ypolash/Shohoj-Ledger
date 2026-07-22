import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_ASSETS");
    if (rbacGuard) return rbacGuard;

    const assets = await prisma.asset.findMany({
      where: { companyId },
      include: {
        category: { select: { name: true } },
        assignedTo: { select: { firstName: true, lastName: true, employeeId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("GET Assets Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_ASSETS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      assetCode, name, categoryId, purchaseDate, purchasePrice, 
      warrantyExpDate, serialNumber, currentLocation, 
      depreciationRate, status, assignedToId, notes 
    } = body;

    if (!assetCode || !name || !categoryId) {
      return NextResponse.json({ error: "Asset Code, Name, and Category are required" }, { status: 400 });
    }

    const existing = await prisma.asset.findFirst({
      where: { companyId, assetCode }
    });

    if (existing) {
      return NextResponse.json({ error: "Asset with this code already exists" }, { status: 400 });
    }

    const asset = await prisma.$transaction(async (tx) => {
      const a = await tx.asset.create({
        data: {
          companyId,
          assetCode,
          name,
          categoryId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          purchasePrice: purchasePrice || 0,
          warrantyExpDate: warrantyExpDate ? new Date(warrantyExpDate) : null,
          serialNumber,
          currentLocation,
          depreciationRate: depreciationRate || 0,
          status: status || "ACTIVE",
          assignedToId: assignedToId || null,
          notes
        }
      });

      await tx.inventoryAudit.create({
        data: {
          companyId,
          action: "ASSET_ASSIGNED",
          entityType: "ASSET",
          entityId: a.id,
          description: `Asset ${name} created${assignedToId ? ' and assigned' : ''}`,
          performedById: session.user.id
        }
      });

      return a;
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("POST Asset Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
