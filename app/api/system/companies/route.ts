import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    // Platform Admins can fetch ALL companies, with subscription and aggregated user counts
    const [companies, userCounts, plans] = await Promise.all([
      prisma.company.findMany({
        include: {
          subscription: {
            include: {
              plan: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.groupBy({
        by: ['companyId'],
        _count: {
          _all: true,
        },
        where: {
          companyId: { not: null },
          platformRole: { not: 'SUPER_ADMIN' },
        }
      }).catch(() => []),
      prisma.subscriptionPlan.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { price: 'asc' },
      }).catch(() => []),
    ]);

    const countMap = new Map(
      userCounts
        .filter((u: any) => u.companyId)
        .map((u: any) => [u.companyId, u._count?._all || 0])
    );

    const enrichedCompanies = companies.map(c => ({
      ...c,
      _count: {
        users: countMap.get(c.id) || 0,
      }
    }));

    return NextResponse.json({ companies: enrichedCompanies, plans });
  } catch (error: any) {
    console.error("GET System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { name, businessType, status = 'ACTIVE', planId } = body;

    if (!name || !businessType) {
      return NextResponse.json({ error: "Company name and business type are required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        businessType,
        status,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          }
        }
      }
    });

    if (planId) {
      await prisma.subscription.upsert({
        where: { companyId: company.id },
        update: {
          planId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          companyId: company.id,
          planId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => null);
    }

    const refetched = await prisma.company.findUnique({
      where: { id: company.id },
      include: {
        subscription: {
          include: {
            plan: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      company: {
        ...(refetched || company),
        _count: { users: 0 }
      } 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { companyId, status, name, businessType, planId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: "Missing required companyId" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (businessType !== undefined) updateData.businessType = businessType;

    // Handle manual plan assignment or modification
    if (planId !== undefined) {
      if (planId) {
        await prisma.subscription.upsert({
          where: { companyId },
          update: {
            planId,
            status: 'ACTIVE',
          },
          create: {
            companyId,
            planId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        // Unassign plan
        await prisma.subscription.deleteMany({
          where: { companyId },
        }).catch(() => null);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.company.update({
        where: { id: companyId },
        data: updateData,
      });
    }

    const [company, userCount] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        include: {
          subscription: {
            include: {
              plan: true,
            }
          }
        }
      }),
      prisma.user.count({
        where: {
          companyId,
          platformRole: { not: 'SUPER_ADMIN' }
        }
      }).catch(() => 0)
    ]);

    return NextResponse.json({ 
      company: {
        ...company,
        _count: { users: userCount }
      } 
    });
  } catch (error: any) {
    console.error("PATCH System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status: 'SUSPENDED' },
      include: {
        subscription: {
          include: {
            plan: true,
          }
        }
      }
    });

    return NextResponse.json({ message: "Company suspended successfully", company });
  } catch (error: any) {
    console.error("DELETE System Companies Error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
