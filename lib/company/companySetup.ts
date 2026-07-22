import { prisma } from "@/lib/prisma";
import { provisionModules } from "./moduleProvision";
import { provisionDefaultRoles } from "./roleProvision";
import { provisionIndustryTemplate } from "./templateProvision";
import bcrypt from "bcryptjs";

export interface CompanySignupPayload {
  companyName: string;
  businessType: string;
  selectedModules: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPasswordRaw: string;
}

/**
 * Orchestrates the full Company Signup flow within a single isolated database transaction.
 * If any internal process fails, the entire company creation is completely rolled back.
 */
export async function setupNewCompany(payload: CompanySignupPayload) {
  const {
    companyName,
    businessType,
    selectedModules,
    ownerName,
    ownerEmail,
    ownerPasswordRaw
  } = payload;

  return await prisma.$transaction(async (tx) => {
    // 1. Pre-validation: Check for duplicate email across the global user scope
    const existingUser = await tx.user.findUnique({
      where: { email: ownerEmail }
    });
    
    if (existingUser) {
      throw new Error("Email is already registered to another account.");
    }

    // 2. Create the Root Company
    const company = await tx.company.create({
      data: {
        name: companyName,
        businessType: businessType,
        status: "ACTIVE"
      }
    });

    // 3. Create Default Company Settings
    await tx.companySetting.create({
      data: {
        companyId: company.id,
        timezone: "Asia/Dhaka",
        currency: "BDT",
        workingDays: JSON.stringify(["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]),
        weeklyHolidays: JSON.stringify(["Friday"]),
        shiftStartTime: "09:00",
        shiftEndTime: "20:00",
        gracePeriodMinutes: 15
      }
    });

    // 4. Provision Modules
    if (selectedModules && selectedModules.length > 0) {
      await provisionModules(tx, company.id, selectedModules);
    }

    // 5. Provision Default Roles & Extract the 'Owner' Role
    const ownerRole = await provisionDefaultRoles(tx, company.id);

    // 6. Create the Company Owner User
    const newOwner = await tx.user.create({
      data: {
        companyId: company.id,
        name: ownerName,
        email: ownerEmail,
        role: "Owner", // Keep string enum backward compatible
        roleId: ownerRole.id,
        platformRole: "USER"
      }
    });

    // 7. Securely attach authentication account wrapper
    const hashedPassword = await bcrypt.hash(ownerPasswordRaw, 10);
    await tx.account.create({
      data: {
        userId: newOwner.id,
        accountId: ownerEmail,
        providerId: "credentials",
        password: hashedPassword
      }
    });

    // 8. Provision Industry Templates
    await provisionIndustryTemplate(tx, company.id, businessType);

    return {
      success: true,
      company,
      owner: newOwner,
      message: "Company setup completed successfully."
    };
  }, {
    maxWait: 10000, 
    timeout: 30000 // Ensure large template inserts have time to resolve
  });
}
