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
    try {
      // 1. Pre-validation: Check for duplicate email across the global user scope
      const existingUser = await tx.user.findUnique({
        where: { email: ownerEmail }
      });
      
      if (existingUser) {
        throw new Error("Email is already registered to another account.");
      }

      // 2. User Creation (initially without companyId)
      const newOwner = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          role: "Owner", // Keep string enum backward compatible
          platformRole: "USER"
        }
      });
      console.log("✓ User Created");

      // 3. Company Creation
      let company;
      try {
        company = await tx.company.create({
          data: {
            name: companyName,
            businessType: businessType,
            status: "ACTIVE"
          }
        });
        
        // Link the user to the company now that it exists
        await tx.user.update({
          where: { id: newOwner.id },
          data: { companyId: company.id }
        });
        console.log("✓ Company Created");
      } catch (companyError: any) {
        console.log(`✗ Company Creation Failed. Error Code: ${companyError.code || companyError.message}`);
        throw companyError;
      }

      // 4. CompanySetting Creation
      try {
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
        console.log("✓ CompanySetting Created");
      } catch (settingError: any) {
        console.log(`✗ CompanySetting Creation Failed. Error Code: ${settingError.code || settingError.message}`);
        throw settingError;
      }

      // 5. CompanyModule Creation
      try {
        if (selectedModules && selectedModules.length > 0) {
          await provisionModules(tx, company.id, selectedModules);
        }
        console.log("✓ CompanyModule Created");
      } catch (moduleError: any) {
        console.log(`✗ CompanyModule Creation Failed. Error Code: ${moduleError.code || moduleError.message}`);
        throw moduleError;
      }

      // 6. Role Creation
      let ownerRole;
      try {
        ownerRole = await provisionDefaultRoles(tx, company.id);
        console.log("✓ Role Created");
      } catch (roleError: any) {
        console.log(`✗ Role Creation Failed. Error Code: ${roleError.code || roleError.message}`);
        throw roleError;
      }

      // 7. Permission Assignment
      try {
        const allPermissions = await tx.permission.findMany();
        if (allPermissions.length > 0) {
          const rolePermissionsData = allPermissions.map(p => ({
            roleId: ownerRole.id,
            permissionId: p.id
          }));
          await Promise.all(
            rolePermissionsData.map(data => tx.rolePermission.create({ data }))
          );
        }
        console.log("✓ Permission Assigned");
      } catch (permError: any) {
        console.log(`✗ Permission Assignment Failed. Error Code: ${permError.code || permError.message}`);
        throw permError;
      }

      // 8. Owner Membership
      try {
        await tx.member.create({
          data: {
            companyId: company.id,
            name: ownerName,
            email: ownerEmail,
            role: "Owner",
            status: "ACTIVE"
          }
        });
        console.log("✓ Owner Membership Created");
      } catch (memberError: any) {
        console.log(`✗ Owner Membership Failed. Error Code: ${memberError.code || memberError.message}`);
        throw memberError;
      }

      // 9. Securely attach authentication account wrapper
      try {
        const hashedPassword = await bcrypt.hash(ownerPasswordRaw, 10);
        await tx.account.create({
          data: {
            userId: newOwner.id,
            accountId: ownerEmail,
            providerId: "credentials",
            password: hashedPassword
          }
        });
      } catch (accountError: any) {
        console.log(`✗ Account Creation Failed. Error Code: ${accountError.code || accountError.message}`);
        throw accountError;
      }

      // 10. Provision Industry Templates
      try {
        await provisionIndustryTemplate(tx, company.id, businessType);
      } catch (templateError: any) {
        console.log(`✗ Template Provision Failed. Error Code: ${templateError.code || templateError.message}`);
        throw templateError;
      }

      console.log("✓ Transaction Committed");

      return {
        success: true,
        company,
        owner: newOwner,
        message: "Company setup completed successfully."
      };
    } catch (error: any) {
      console.log(`✗ Transaction Failed. Rolling back.`);
      throw error;
    }
  }, {
    maxWait: 10000, 
    timeout: 30000 // Ensure large template inserts have time to resolve
  });
}
