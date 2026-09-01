import { NextResponse } from "next/server";
import { CompanyService } from "@/lib/company/companyService";
import { ApiErrorHandler } from "@/lib/security/errorHandler";
import { getCompanyContext } from "@/lib/auth/getCompanyContext";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // The registerCompany method safely executes an atomic prisma.$transaction
    // which creates the Company, default Settings, Industry Templates, Roles,
    // and the founding Owner user account.
    const newCompany = await CompanyService.registerCompany({
      companyName: payload.companyName?.trim(),
      ownerEmail: payload.ownerEmail?.trim().toLowerCase(),
      ownerPasswordRaw: payload.ownerPasswordRaw,
      ownerName: payload.ownerName?.trim() || "Company Owner",
      businessType: payload.businessType || "Product + Service",
      selectedModules: payload.selectedModules || [],
      logoUrl: payload.logoUrl || null,
    });

    // Automatically log the new owner in by generating their session
    const context = await getCompanyContext(newCompany.owner.id, "ADMIN");
    
    const sessionPayload = {
      id: newCompany.owner.id,
      email: newCompany.owner.email,
      name: newCompany.owner.name,
      loginType: "ADMIN",
      role: context.dbRoleName || "Owner",
      ...context,
    };
    
    await createSession(sessionPayload);

    return NextResponse.json({
      success: true,
      message: "Company and owner account successfully provisioned.",
      data: {
        companyId: newCompany.company.id,
        companyName: newCompany.company.name,
        ownerId: newCompany.owner.id,
        ownerEmail: newCompany.owner.email
      }
    }, { status: 201 });

  } catch (error: any) {
    // If the error is a known validation issue (e.g. Email already exists)
    if (error.message === "User with this email already exists." || error.message === "Company name is required." || error.message === "Owner credentials are required.") {
      return NextResponse.json({ error: "Validation Error", message: error.message }, { status: 400 });
    }

    // Otherwise, route through the central error handler for secure logging
    return ApiErrorHandler.handle(error, "COMPANY_SIGNUP");
  }
}
