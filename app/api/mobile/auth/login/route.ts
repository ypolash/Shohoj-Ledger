import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** CORS headers required for Android / mobile HTTP clients */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
 * Accepts an employeeId (e.g. "EMP-1001") and password.
 * Returns employee details on success.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, password } = body;

    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, message: "Employee ID and password are required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Look up employee by their human-readable employeeId (e.g. EMP-1001)
    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    console.log("[Mobile Login] employeeId received:", employeeId);
    console.log("[Mobile Login] Employee found in DB:", !!employee);

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

    console.log("[Mobile Login] Password match:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID or Password" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Success — return employee context for the Android app
    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: employee.phone ?? null,
        designation: employee.designation ?? "Employee",
        department: employee.department ?? null,
        status: employee.status,
        companyId: employee.companyId ?? null,
      },
    }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Login] API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
