import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { verifyPassword } from "better-auth/crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Super Admin email and password are required." },
        { status: 400 }
      );
    }

    // 1. Locate user in User table
    const user = await prisma.user.findFirst({
      where: { email },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid Super Admin credentials." },
        { status: 401 }
      );
    }

    // STRICT CHECK: User MUST be platformRole === 'SUPER_ADMIN'
    if (user.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Access Denied: This portal is strictly restricted to platform Super Administrators.",
        },
        { status: 403 }
      );
    }

    // 2. Verify password against Account table
    const account = user.accounts?.find(a => a.password);
    if (!account || !account.password) {
      return NextResponse.json(
        { success: false, message: "No password configured for this admin account." },
        { status: 401 }
      );
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, account.password);
    } catch (e) {
      console.error("Bcrypt compare error:", e);
    }

    if (!isMatch) {
      try {
        isMatch = await verifyPassword({ hash: account.password, password });
      } catch (e) {
        // ignore
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid Super Admin credentials." },
        { status: 401 }
      );
    }

    // 3. Create Super Admin session
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      loginType: "SUPER_ADMIN",
      role: "SuperAdmin",
      platformRole: "SUPER_ADMIN",
      companyId: null, // Global platform master
      roleId: null,
      dbRoleName: "SuperAdmin",
    };

    await createSession(payload);

    return NextResponse.json({
      success: true,
      user: payload,
      redirectUrl: "/super-admin",
    });
  } catch (error: any) {
    console.error("Super Admin Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
