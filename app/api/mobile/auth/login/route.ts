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
 * OPTIONS /api/mobile/auth/login
 * Preflight handler for CORS — required by Android HTTP clients.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/mobile/auth/login
 *
 * Mobile authentication endpoint used by the Android app.
 * Accepts an employeeId (e.g. "EMP-1001" or email) and password.
 * Returns employee details and session token on success.
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

    // Look up employee by their employeeId, email, or id
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: rawIdentifier },
          { email: rawIdentifier.toLowerCase() },
          { id: rawIdentifier },
        ],
      },
    });

    console.log("[Mobile Auth Login] rawIdentifier received:", rawIdentifier);
    console.log("[Mobile Auth Login] Employee found in DB:", !!employee);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID or Password" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    if (!employee.password) {
      return NextResponse.json(
        { success: false, message: "No password set for this account. Please contact your administrator." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Verify password (bcrypt)
    let passwordMatch = await bcrypt.compare(password, employee.password);

    // Fallback for legacy plaintext passwords (if any exist)
    if (!passwordMatch && employee.password === password) {
      passwordMatch = true;
    }

    console.log("[Mobile Auth Login] Password match:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID or Password" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

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

    // Success — return employee context for the Android app
    const res = NextResponse.json({
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
        designation: employee.designation ?? "Employee",
        department: employee.department ?? null,
        status: employee.status,
        companyId: employee.companyId ?? null,
      },
      user: userPayload,
    }, { headers: CORS_HEADERS });

    // Set session cookie directly on response
    res.cookies.set("session", sessionToken, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("[Mobile Auth Login] API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
