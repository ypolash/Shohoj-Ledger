import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    if (!companyId) {
      return NextResponse.json({ success: true, mode: "PROFESSIONAL" });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: `onboarding_mode_${companyId}` }
    });

    // Default to PROFESSIONAL if not explicitly configured
    const mode = setting?.value === "BASIC" ? "BASIC" : "PROFESSIONAL";

    return NextResponse.json({
      success: true,
      mode
    });
  } catch (error: any) {
    console.error("Failed to get onboarding mode:", error);
    return NextResponse.json({ success: true, mode: "PROFESSIONAL" });
  }
}

export async function PUT(request: Request) {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const mode = body.mode === "BASIC" ? "BASIC" : "PROFESSIONAL";

    await prisma.systemSetting.upsert({
      where: { key: `onboarding_mode_${companyId}` },
      update: { value: mode, description: "Employee data collection mode (BASIC or PROFESSIONAL)" },
      create: {
        key: `onboarding_mode_${companyId}`,
        value: mode,
        description: "Employee data collection mode (BASIC or PROFESSIONAL)"
      }
    });

    return NextResponse.json({
      success: true,
      mode
    });
  } catch (error: any) {
    console.error("Failed to update onboarding mode:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
