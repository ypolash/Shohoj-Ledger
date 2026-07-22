import { NextResponse } from "next/server";
import { ModuleService } from "./moduleService";

/**
 * Validates whether a specific ERP module is enabled for a given company.
 * 
 * @param companyId The ID of the authenticated company
 * @param moduleKey The string key of the required module (e.g., "PAYROLL")
 * @returns null if permitted, or a 403 NextResponse if forbidden.
 */
export async function requireModule(companyId: string | null, moduleKey: string) {
  if (!companyId) {
    // If no company context is provided, they inherently lack module access.
    return NextResponse.json(
      { error: `Forbidden: Tenant context missing for module ${moduleKey}` }, 
      { status: 403 }
    );
  }

  const activeModules = await ModuleService.listActiveModules(companyId);

  if (!activeModules.includes(moduleKey)) {
    return NextResponse.json(
      { error: `Forbidden: Module ${moduleKey} is not enabled for this company.` }, 
      { status: 403 }
    );
  }

  // Null means the guard passed successfully.
  return null;
}
