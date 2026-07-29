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
 * OPTIONS /api/mobile/login
 * Preflight handler for CORS — required by Android HTTP clients.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/mobile/login
 * Mobile login endpoint used by the Android (Shohoj Staff) app.
 * Accepts employeeId (e.g. "EMP-1001") and password.
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

    const employee = await prisma.employee.findUnique({
      where: { employeeId },
    });

    console.log("[Mobile Login] employeeId received:", employeeId);
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
      return NextResponse.json(
        {
          success: true,
          token: "demo-token-123", // Added for Android compatibility
          userId: employee.id,    // Added for Android compatibility
          name: `${employee.firstName} ${employee.lastName}`, // Added for Android compatibility
          email: employee.email,   // Added for Android compatibility
          employee: {
            id: employee.id,
            employeeId: employee.employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email,
            phone: employee.phone ?? null,
            designation: employee.designation || "Employee",
            department: employee.department ?? null,
            status: employee.status,
            companyId: employee.companyId ?? null,
          },
        },
        { headers: CORS_HEADERS }
      );
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