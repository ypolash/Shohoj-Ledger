import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

// Ensure caller is a platform SUPER_ADMIN
async function ensureSuperAdmin() {
  const session = await getSession();
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.platformRole !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: Requires SUPER_ADMIN" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function GET(req: Request) {
  try {
    const { error } = await ensureSuperAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const platformRole = searchParams.get("platformRole") || "";
    const companyId = searchParams.get("companyId") || "";
    const role = searchParams.get("role") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Exclude Super Admin accounts - this view is exclusively for managing tenant users
    where.platformRole = { not: "SUPER_ADMIN" };
    where.email = { not: "team@shohoj.com" };

    if (companyId) {
      where.companyId = companyId;
    }

    if (role) {
      where.role = { contains: role, mode: "insensitive" };
    }

    const tenantWhere = {
      platformRole: { not: "SUPER_ADMIN" as const },
      email: { not: "team@shohoj.com" },
    };

    const [rawUsers, totalTenantUsers, verifiedCount, companies] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          platformRole: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              supportTickets: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: tenantWhere }),
      prisma.user.count({ where: { ...tenantWhere, emailVerified: true } }),
      prisma.company.findMany({
        select: { id: true, name: true, businessType: true, status: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const companyMap = new Map(companies.map(c => [c.id, c]));

    const users = rawUsers.map(u => ({
      ...u,
      company: u.companyId ? companyMap.get(u.companyId) || null : null,
    }));

    return NextResponse.json({
      users,
      companies,
      metrics: {
        totalTenantUsers,
        totalCompanies: companies.length,
        verifiedCount,
        unverifiedCount: totalTenantUsers - verifiedCount,
      },
    });
  } catch (err: any) {
    console.error("GET /api/system/users Error:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await ensureSuperAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, email, password, role, platformRole, companyId, emailVerified } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        emailVerified: Boolean(emailVerified),
        role: role || "Member",
        platformRole: platformRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER",
        companyId: companyId || null,
        accounts: {
          create: {
            accountId: normalizedEmail,
            providerId: "credentials",
            password: hashedPassword,
          },
        },
      },
    });

    const company = user.companyId ? await prisma.company.findUnique({ where: { id: user.companyId } }) : null;

    return NextResponse.json({ success: true, user: { ...user, company } });
  } catch (err: any) {
    console.error("POST /api/system/users Error:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { error, session } = await ensureSuperAdmin();
    if (error) return error;

    const body = await req.json();
    const { userId, name, email, role, platformRole, companyId, emailVerified, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: don't allow current user to demote themselves from SUPER_ADMIN
    if (session?.user?.id === userId && platformRole === "USER") {
      return NextResponse.json({ error: "You cannot demote yourself from Super Admin." }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (platformRole !== undefined) updateData.platformRole = platformRole;
    if (companyId !== undefined) updateData.companyId = companyId || null;
    if (emailVerified !== undefined) updateData.emailVerified = Boolean(emailVerified);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // If new password provided, update credentials account
    if (newPassword && newPassword.trim()) {
      const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
      const existingAccount = targetUser.accounts?.find(a => a.providerId === "credentials" || a.password);
      if (existingAccount) {
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        await prisma.account.create({
          data: {
            userId: targetUser.id,
            accountId: updatedUser.email,
            providerId: "credentials",
            password: hashedPassword,
          },
        });
      }
    }

    const company = updatedUser.companyId ? await prisma.company.findUnique({ where: { id: updatedUser.companyId } }) : null;

    return NextResponse.json({ success: true, user: { ...updatedUser, company } });
  } catch (err: any) {
    console.error("PATCH /api/system/users Error:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error, session } = await ensureSuperAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (session?.user?.id === userId) {
      return NextResponse.json({ error: "You cannot delete your own Super Admin account." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety: prevent deleting if it's the last super admin
    if (targetUser.platformRole === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({ where: { platformRole: "SUPER_ADMIN" } });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the only remaining Super Admin account." }, { status: 400 });
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/system/users Error:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}
