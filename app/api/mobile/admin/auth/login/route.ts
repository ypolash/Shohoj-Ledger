import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { verifyPassword } from "better-auth/crypto";
import { getCompanyContext } from "@/lib/auth/getCompanyContext";
import { CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email?.trim();
    const email = rawEmail?.toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Find User in DB
    const user = await prisma.user.findFirst({
      where: { email },
      include: { accounts: true },
    });

    if (!user || !user.accounts || user.accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your email and password." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 2. Validate Password
    const account = user.accounts.find((a) => a.password);
    if (!account || !account.password) {
      return NextResponse.json(
        { success: false, error: "Account credentials not configured properly." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, account.password);
    } catch (e) {
      console.error("[Mobile Admin Login] Bcrypt error:", e);
    }

    if (!isMatch) {
      try {
        isMatch = await verifyPassword({ hash: account.password, password });
      } catch (e) {
        // Ignore better-auth format error
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your email and password." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 3. Resolve context and company
    const context = await getCompanyContext(user.id, "ADMIN");
    const companyId = context.companyId || user.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "No company associated with this account." },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, businessType: true, logoUrl: true },
    });

    // 4. Verify Admin/Owner permissions
    const userRole = (user.role || context.dbRoleName || "").toLowerCase();
    const isOwnerOrAdmin =
      userRole.includes("owner") ||
      userRole.includes("admin") ||
      user.platformRole === "SUPER_ADMIN";

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { success: false, error: "Access denied. Only CRM Owners and Admins can use this app." },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // 5. Generate Session Token (JWT)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      loginType: "ADMIN",
      role: context.dbRoleName || user.role || "Owner",
      companyId: companyId,
      businessType: context.businessType || company?.businessType || "Product + Service",
      platformRole: user.platformRole,
      roleId: context.roleId,
    };

    const sessionToken = await createSession(payload, 30);

    const response = NextResponse.json(
      {
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: payload.role,
          platformRole: user.platformRole,
        },
        company: {
          id: company?.id || companyId,
          name: company?.name || "My Company",
          businessType: company?.businessType || "Business",
          logoUrl: company?.logoUrl || null,
        },
      },
      { headers: CORS_HEADERS }
    );

    // Also attach cookie directly for Android SessionCookieJar
    response.cookies.set("session", sessionToken, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Mobile Admin Login] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again later." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
