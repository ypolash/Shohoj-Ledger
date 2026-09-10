import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-type",
};

export async function verifyMobileAdmin() {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Admin or Owner." },
        { status: 401, headers: CORS_HEADERS }
      ),
    };
  }

  const user = session.user;
  const role = (user.role || "").toLowerCase();
  const platformRole = (user.platformRole || "").toUpperCase();

  // Validate Owner, Admin, or Super Admin privileges
  const isOwner = role.includes("owner") || role.includes("admin") || user.loginType === "ADMIN";
  const isSuperAdmin = platformRole === "SUPER_ADMIN" || platformRole === "CLIENT_ADMIN";

  if (!isOwner && !isSuperAdmin) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "Forbidden: This app is restricted to CRM Admins and Owners." },
        { status: 403, headers: CORS_HEADERS }
      ),
    };
  }

  // Ensure companyId is present
  let companyId = user.companyId;
  if (!companyId) {
    // If companyId is missing in session payload, look up user directly in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, role: true, platformRole: true },
    });
    companyId = dbUser?.companyId || null;
  }

  if (!companyId) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "No company associated with this admin account." },
        { status: 400, headers: CORS_HEADERS }
      ),
    };
  }

  return {
    authorized: true as const,
    user,
    companyId,
  };
}
