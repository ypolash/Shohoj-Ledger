import { prisma } from "@/lib/prisma";
import { provisionModules } from "./moduleProvision";
import { provisionDefaultRoles } from "./roleProvision";
import { provisionIndustryTemplate } from "./templateProvision";
import bcrypt from "bcryptjs";

import { mapIndustryToProjectPreset } from "@/lib/projects/projectPresets";

export interface CompanySignupPayload {
  companyName: string;
  businessType: string;
  industryTemplate?: string;
  projectPreset?: string;
  selectedModules: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPasswordRaw: string;
  logoUrl?: string | null;
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
    ownerPasswordRaw,
    logoUrl
  } = payload;

  const normalizedEmail = ownerEmail?.trim().toLowerCase();

  return await prisma.$transaction(async (tx) => {
    try {
      // 1. Pre-validation: Check for duplicate email across the global user scope
      const existingUser = await tx.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" }
        }
      });
      
      if (existingUser) {
        throw new Error(`Email is already registered to another account.`);
      }

      // 2. User Creation (initially without companyId)
      const newOwner = await tx.user.create({
        data: {
          name: ownerName,
          email: normalizedEmail,
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
            status: "ACTIVE",
            logoUrl: logoUrl || null
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
            email: normalizedEmail,
            role: "Owner",
            status: "ACTIVE"
          }
        });
        console.log("✓ Owner Membership Created");
      } catch (memberError: any) {
        console.log(`✗ Owner Membership Failed. Error Code: ${memberError.code || memberError.message}`);
        throw memberError;
      }

      // 8.5 Auto-create founding Owner Employee Profile so staff dropdowns, tasks, and duty roster immediately work
      try {
        const nameParts = (ownerName || "Company Owner").trim().split(" ");
        const firstName = nameParts[0] || "Owner";
        const lastName = nameParts.slice(1).join(" ") || "(Founder)";
        const ownerEmpId = `EMP-${newOwner.id.slice(0, 4).toUpperCase()}`;

        await tx.employee.create({
          data: {
            companyId: company.id,
            employeeId: ownerEmpId,
            firstName,
            lastName,
            email: normalizedEmail,
            designation: "Managing Director / Owner",
            department: "Executive Management",
            employmentType: "Full-Time",
            employmentStatus: "Active",
            basicSalary: 0,
            joinDate: new Date(),
            userId: newOwner.id,
            systemSource: "ERP",
            password: "SSO_USER_ACCOUNT",
          }
        });
        console.log("✓ Owner Employee Profile Created");
      } catch (empErr: any) {
        console.warn("Owner Employee Profile creation warning:", empErr?.message);
      }

      // 9. Securely attach authentication account wrapper
      try {
        const hashedPassword = await bcrypt.hash(ownerPasswordRaw, 10);
        await tx.account.create({
          data: {
            userId: newOwner.id,
            accountId: normalizedEmail,
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
        await provisionIndustryTemplate(tx, company.id, payload.industryTemplate || businessType);
      } catch (templateError: any) {
        console.log(`✗ Template Provision Failed. Error Code: ${templateError.code || templateError.message}`);
        throw templateError;
      }

      // 11. Provision Project Structure Preset & Starter Project
      try {
        const resolvedPreset = payload.projectPreset || mapIndustryToProjectPreset(payload.industryTemplate || businessType);
        await tx.systemSetting.create({
          data: {
            key: `project_default_preset_${company.id}`,
            value: resolvedPreset,
            description: "Default project structure preset selected during company onboarding"
          }
        });

        // Provision initial starter project
        let spName = "Product Launch & Operations";
        let spCode = "PRD-01";
        let spCategory = "Operations";
        const indLower = (payload.industryTemplate || businessType || "").toLowerCase();

        if (indLower.includes("software") || indLower.includes("it")) {
          spName = "Core Web Platform & Mobile MVP";
          spCode = "MVP-01";
          spCategory = "Software Development";
        } else if (indLower.includes("video") || indLower.includes("media")) {
          spName = "Brand Commercial & Social Cuts";
          spCode = "VID-01";
          spCategory = "Video Production";
        } else if (indLower.includes("hotel") || indLower.includes("resturant") || indLower.includes("restaurant") || indLower.includes("food")) {
          spName = "Menu Launch & Kitchen Operations";
          spCode = "RES-01";
          spCategory = "Restaurant Operations";
        } else if (indLower.includes("pharmacy") || indLower.includes("pharmecy") || indLower.includes("health")) {
          spName = "Clinical Stocking & Dispensing Setup";
          spCode = "PHM-01";
          spCategory = "Pharmacy Operations";
        } else if (indLower.includes("electronic") || indLower.includes("gadget")) {
          spName = "Electronics Showroom & Serial Inventory";
          spCode = "GDT-01";
          spCategory = "Retail & Gadgets";
        } else if (indLower.includes("beauty") || indLower.includes("beuty") || indLower.includes("cosmetic")) {
          spName = "Cosmetics Catalog & Salon Operations";
          spCode = "CSM-01";
          spCategory = "Beauty & Cosmetics";
        } else if (indLower.includes("education") || indLower.includes("academic")) {
          spName = "Batch 01 Curriculum & Admissions";
          spCode = "EDU-01";
          spCategory = "Academic Cohort";
        }

        const now = new Date();
        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await tx.project.create({
          data: {
            companyId: company.id,
            projectCode: spCode,
            name: spName,
            category: spCategory,
            priority: "High",
            status: "Active",
            progress: 15,
            startDate: now,
            endDate: in30Days,
            estimatedBudget: 100000,
            actualCost: 0,
            systemSource: "ERP",
            description: `Starter project provisioned for ${companyName}. Tailored for ${spCategory}.`
          }
        });

        console.log("✓ Project Preset and Starter Project Provisioned:", resolvedPreset);
      } catch (presetError: any) {
        console.log(`✗ Project Preset Provision Non-Fatal Warning:`, presetError?.message);
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
