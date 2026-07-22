import { NextResponse } from "next/server";
import { CompanyService } from "@/lib/company/companyService";
import { ApiErrorHandler } from "@/lib/security/errorHandler";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // The registerCompany method safely executes an atomic prisma.$transaction
    // which creates the Company, default Settings, Industry Templates, Roles,
    // and the founding Owner user account.
    const newCompany = await CompanyService.registerCompany({
      companyName: payload.companyName,
      ownerEmail: payload.ownerEmail,
      ownerPasswordRaw: payload.ownerPasswordRaw,
      ownerName: payload.ownerName || "Company Owner",
      businessType: payload.businessType || "Product + Service",
      selectedModules: payload.selectedModules || [],
    });

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
