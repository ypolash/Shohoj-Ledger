import { prisma } from "@/lib/prisma";
import { setupNewCompany, CompanySignupPayload } from "./companySetup";

/**
 * Top-level Company Service layer to interface with API controllers.
 */
export class CompanyService {
  /**
   * Registers a new tenant and performs the complete onboarding flow.
   * Defers actual execution to the transaction-safe companySetup wrapper.
   */
  static async registerCompany(payload: CompanySignupPayload) {
    // Top-level sanity checks
    if (!payload.companyName || payload.companyName.trim() === "") {
      throw new Error("Company name is required.");
    }

    if (!payload.ownerEmail || !payload.ownerPasswordRaw) {
      throw new Error("Owner credentials are required.");
    }

    // Forward to the transactional setup orchestrator
    return await setupNewCompany(payload);
  }

  /**
   * Safe read method to retrieve company core details.
   */
  static async getCompanyProfile(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        settings: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    if (!company) {
      throw new Error("Company not found.");
    }

    return company;
  }
}
