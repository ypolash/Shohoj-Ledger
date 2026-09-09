import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { getCompanyContext } from "@/lib/auth/getCompanyContext";

/** CORS headers required for Android / mobile HTTP clients */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-employee-id, x-employee-db-id",
};

/**
 * OPTIONS /api/mobile/login
 * Preflight handler for CORS — required by Android HTTP clients.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/mobile/login
 * Mobile login endpoint used by the Android (Shohoj Staff) app.
 * Accepts employeeId (e.g. "EMP-1001" or email) and password.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawIdentifier = (body.employeeId || body.email)?.trim();
    const { password } = body;

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, message: "Employee ID and password are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: rawIdentifier },
          { email: rawIdentifier.toLowerCase() },
          { id: rawIdentifier },
        ],
      },
    });

    console.log("[Mobile Login] rawIdentifier received:", rawIdentifier);
    console.log("[Mobile Login] Employee found:", !!employee);

    let passwordMatch = false;
    if (employee && employee.password) {
      passwordMatch = await bcrypt.compare(password, employee.password);

      // Fallback for legacy plaintext passwords
      if (!passwordMatch && employee.password === password) {
        passwordMatch = true;
      }
    }

    console.log("[Mobile Login] Password match:", passwordMatch);

    if (employee && passwordMatch) {
      // 1. Resolve company context
      const context = await getCompanyContext(employee.id, "EMPLOYEE");

      // 2. Prepare user payload for session
      const userPayload = {
        id: employee.id,
        employeeId: employee.employeeId,
        email: employee.email,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        loginType: "EMPLOYEE",
        role: context.dbRoleName || "Employee",
        ...context,
      };

      // 3. Create session & generate JWT
      const sessionToken = await createSession(userPayload, 30);

      const res = NextResponse.json(
        {
          success: true,
          token: sessionToken,
          userId: employee.id,
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          email: employee.email,
          employee: {
            id: employee.id,
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            email: employee.email,
            phone: employee.phone ?? null,
            designation: employee.designation || "Employee",
            department: employee.department ?? null,
            status: employee.status,
            companyId: employee.companyId ?? null,
          },
          user: userPayload,
        },
        { headers: CORS_HEADERS }
      );

      // Set cookie directly on response for Android SessionCookieJar
      res.cookies.set("session", sessionToken, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res;
    }

    return NextResponse.json(
      { success: false, message: "Invalid Employee ID or Password" },
      { status: 401, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[Mobile Login] API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}