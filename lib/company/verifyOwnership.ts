import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Verifies that the requested record belongs to the authenticated user's company.
 * Usage for PUT/DELETE APIs.
 * Returns null if authorized, otherwise returns a 403/401 NextResponse.
 */
export async function verifyOwnership(model: string, id: string) {
  const session = await getSession();
  
  if (!session || !session.user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.user.companyId;
  if (!companyId) {
    // If the user has no company ID (e.g., they are a superadmin without a specific tenant),
    // strictly deny access to isolated tenant records unless platform-level rules apply.
    return NextResponse.json({ success: false, message: "Company context missing" }, { status: 403 });
  }

  const delegate = (prisma as any)[model];
  if (!delegate) {
    console.error(`verifyOwnership: Model ${model} not found on Prisma Client.`);
    return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
  }

  // Fetch only the companyId to verify ownership
  const record = await delegate.findUnique({
    where: { id },
    select: { companyId: true }
  });

  if (!record) {
    // Return 404 to avoid leaking existence of cross-tenant records
    return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
  }

  if (record.companyId !== companyId) {
    // Return 404 instead of 403 to prevent cross-tenant enumeration attacks
    return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
  }

  // Authorized
  return null;
}
