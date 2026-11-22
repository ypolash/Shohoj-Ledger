import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { createLedgerEntry } from "@/lib/ledger";
import { getPresetById, PROJECT_PRESETS, ProjectPresetId, mapIndustryToProjectPreset } from "@/lib/projects/projectPresets";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");
    const managerId = url.searchParams.get("managerId");
    const client = url.searchParams.get("client");

    const where: any = { companyId };
    
    if (status) where.status = status;
    if (managerId) where.managerId = managerId;
    
    if (search || client) {
      const q = search || client;
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } },
        { clientName: { contains: q, mode: 'insensitive' } },
        { clientPhone: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    let projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { select: { firstName: true, lastName: true } },
        teamMembers: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: { select: { id: true, status: true, estimatedHours: true, actualHours: true } }
      }
    });

    // If company has 0 projects and no search query, auto-provision starter projects matching the company's industry preset
    if (projects.length === 0 && !search && !status && !client) {
      try {
        const presetSetting = await prisma.systemSetting.findUnique({
          where: { key: `project_default_preset_${companyId}` }
        });
        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { businessType: true }
        });
        const presetId = (presetSetting?.value as ProjectPresetId) || mapIndustryToProjectPreset(company?.businessType);
        const preset = PROJECT_PRESETS[presetId] || PROJECT_PRESETS.manufacturing_engineering;

        const starterProjects: { name: string; code: string; budget: number; category: string }[] = [];

        if (presetId === "software_it") {
          starterProjects.push({ name: "Core Web Platform & Mobile MVP", code: "MVP-01", budget: 150000, category: "Software Development" });
          starterProjects.push({ name: "Cloud Infrastructure & CI/CD Pipeline", code: "OPS-01", budget: 80000, category: "DevOps & Cloud" });
        } else if (presetId === "video_agency") {
          starterProjects.push({ name: "Brand Commercial & Social Cuts", code: "VID-01", budget: 120000, category: "Video Production" });
          starterProjects.push({ name: "Product Shoot & Reels Campaign", code: "VID-02", budget: 65000, category: "Commercial Shoot" });
        } else if (presetId === "digital_marketing") {
          starterProjects.push({ name: "Q1 Performance Marketing & Social Ads", code: "MKT-01", budget: 90000, category: "Digital Marketing" });
        } else if (presetId === "education_academic") {
          starterProjects.push({ name: "Batch 01 Curriculum & Student Enrollment", code: "EDU-01", budget: 100000, category: "Academic Cohort" });
        } else if (presetId === "consulting_professional") {
          starterProjects.push({ name: "Enterprise Business Audit & Advisory", code: "CNS-01", budget: 120000, category: "Strategic Advisory" });
        } else if (presetId === "construction_realestate") {
          starterProjects.push({ name: "Site Development & Structural Phase 1", code: "BLD-01", budget: 500000, category: "Civil Construction" });
        } else {
          const bType = (company?.businessType || "").toLowerCase();
          if (bType.includes("hotel") || bType.includes("resturant") || bType.includes("restaurant") || bType.includes("food")) {
            starterProjects.push({ name: "Menu Launch & Kitchen POS Workflow", code: "RES-01", budget: 75000, category: "Restaurant Operations" });
          } else if (bType.includes("pharmacy") || bType.includes("pharmecy") || bType.includes("health")) {
            starterProjects.push({ name: "Clinical Stocking & Regulatory Setup", code: "PHM-01", budget: 150000, category: "Pharmacy Operations" });
          } else if (bType.includes("electronic") || bType.includes("gadget")) {
            starterProjects.push({ name: "Electronics Showroom & Serial Inventory", code: "GDT-01", budget: 200000, category: "Retail & Gadgets" });
          } else if (bType.includes("beauty") || bType.includes("beuty") || bType.includes("cosmetic")) {
            starterProjects.push({ name: "Cosmetics Catalog & Salon Operations", code: "CSM-01", budget: 85000, category: "Beauty & Cosmetics" });
          } else {
            starterProjects.push({ name: "Product Line Launch & Packaging Run", code: "PRD-01", budget: 150000, category: "Production & Retail" });
            starterProjects.push({ name: "Distributor Network & Stock Dispatch", code: "DST-01", budget: 100000, category: "Supply Chain" });
          }
        }

        const now = new Date();
        const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        for (const sp of starterProjects) {
          const exists = await prisma.project.findFirst({
            where: { companyId, projectCode: sp.code }
          });
          if (!exists) {
            await prisma.project.create({
              data: {
                companyId,
                projectCode: sp.code,
                name: sp.name,
                category: sp.category,
                priority: "High",
                status: "Active",
                progress: 15,
                startDate: now,
                endDate: in30Days,
                estimatedBudget: sp.budget,
                actualCost: 0,
                systemSource: "ERP",
                description: `Starter project provisioned for ${preset.name}. Tailored for ${preset.category}.`
              }
            });
          }
        }

        // Re-fetch after auto-provisioning
        projects = await prisma.project.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            manager: { select: { firstName: true, lastName: true } },
            teamMembers: { select: { id: true, firstName: true, lastName: true, email: true } },
            tasks: { select: { id: true, status: true, estimatedHours: true, actualHours: true } }
          }
        });
      } catch (seedErr) {
        console.warn("Auto-provision starter projects non-fatal warning:", seedErr);
      }
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_PROJECTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      projectCode, name, description, category, priority, 
      clientName, clientPhone, leadId, managerId, teamMemberIds, 
      startDate, endDate, expectedShootingDate, expectedEditingDate,
      estimatedBudget, actualCost, advancePayment, advancePay, tags 
    } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedCode = typeof projectCode === "string" ? projectCode.trim() : "";

    if (!trimmedName || !trimmedCode) {
      return NextResponse.json({ error: "Project Name and Project Code are required." }, { status: 400 });
    }

    // Duplicate Check for Project Code
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const existing = await prisma.project.findFirst({
      where: {
        companyId,
        projectCode: trimmedCode
      }
    });

    if (existing) {
      return NextResponse.json({ error: `A project with code "${trimmedCode}" already exists.` }, { status: 400 });
    }

    // Sanitize Foreign Keys & Optional Values to avoid database constraint violations
    let validManagerId: string | null = null;
    if (typeof managerId === "string" && managerId.trim().length > 0) {
      const emp = await prisma.employee.findFirst({
        where: { id: managerId.trim(), companyId }
      });
      if (emp) validManagerId = emp.id;
    }

    let validLeadId: string | null = null;
    if (typeof leadId === "string" && leadId.trim().length > 0) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId.trim(), companyId }
      });
      if (lead) validLeadId = lead.id;
    }

    const parseDate = (val: any): Date | null => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);
    const parsedShootingDate = parseDate(expectedShootingDate);
    const parsedEditingDate = parseDate(expectedEditingDate);

    const parsedBudget = (estimatedBudget !== undefined && estimatedBudget !== null && estimatedBudget !== "" && !isNaN(Number(estimatedBudget)))
      ? Number(estimatedBudget)
      : null;

    const parsedActualCost = (actualCost !== undefined && actualCost !== null && actualCost !== "" && !isNaN(Number(actualCost)))
      ? Number(actualCost)
      : 0;

    const parsedAdvance = (advancePayment !== undefined && advancePayment !== null && advancePayment !== "" && !isNaN(Number(advancePayment)))
      ? Math.max(0, Number(advancePayment))
      : (advancePay !== undefined && advancePay !== null && advancePay !== "" && !isNaN(Number(advancePay)))
      ? Math.max(0, Number(advancePay))
      : 0;

    // Filter valid team members
    let validTeamMembers: { id: string }[] = [];
    if (Array.isArray(teamMemberIds) && teamMemberIds.length > 0) {
      const ids = teamMemberIds.filter((id: any) => typeof id === "string" && id.trim().length > 0);
      if (ids.length > 0) {
        const found = await prisma.employee.findMany({
          where: { id: { in: ids }, companyId },
          select: { id: true }
        });
        validTeamMembers = found.map(f => ({ id: f.id }));
      }
    }

    // Initialize Workflow Preset Metadata
    let finalDescription = description?.trim() || "";
    if (!finalDescription.includes("[[WORKFLOW_META_V1:")) {
      let defaultPresetId = body.presetId;
      if (!defaultPresetId) {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: `project_default_preset_${companyId}` }
        });
        defaultPresetId = setting?.value || "video_agency";
      }

      // Check for any company-level custom configs for this preset
      const customSetting = await prisma.systemSetting.findUnique({
        where: { key: `project_custom_preset_config_${companyId}` }
      });
      let customPresetConfig = null;
      if (customSetting?.value) {
        try {
          const parsed = JSON.parse(customSetting.value);
          customPresetConfig = parsed[defaultPresetId] || null;
        } catch {}
      }

      const presetDef = getPresetById(defaultPresetId);
      const stageNames: Record<number, string> = {};
      for (let s = 1; s <= 7; s++) {
        stageNames[s] = customPresetConfig?.stageNames?.[s] || presetDef.stages[s]?.name || `Stage ${s}`;
      }

      const initialWorkflowMeta = {
        presetId: defaultPresetId,
        currentStage: 1,
        completedStages: [],
        stageNames,
        customFieldValues: {},
        customFields: customPresetConfig?.customFields || presetDef.defaultFields || []
      };

      const metaString = `[[WORKFLOW_META_V1:${JSON.stringify(initialWorkflowMeta)}]]`;
      finalDescription = finalDescription ? `${finalDescription}\n\n${metaString}` : metaString;
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const p = await (tx.project as any).create({
        data: {
          companyId,
          projectCode: trimmedCode,
          name: trimmedName,
          description: finalDescription,
          category: category?.trim() || null,
          priority: priority || "Medium",
          status: "Draft",
          clientName: clientName?.trim() || null,
          clientPhone: clientPhone?.trim() || null,
          leadId: validLeadId,
          managerId: validManagerId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          expectedShootingDate: parsedShootingDate,
          expectedEditingDate: parsedEditingDate,
          estimatedBudget: parsedBudget,
          actualCost: parsedActualCost,
          tags: Array.isArray(tags) ? tags : [],
          systemSource
        }
      });

      if (validTeamMembers.length > 0) {
        await (tx.project as any).update({
          where: { id: p.id },
          data: {
            teamMembers: {
              connect: validTeamMembers
            }
          }
        });

        for (const member of validTeamMembers) {
          const emp = await tx.employee.findUnique({
            where: { id: member.id },
            select: { employmentType: true, basicSalary: true }
          });
          const isProjectBased = emp?.employmentType === "Project-Based";
          const rate = isProjectBased ? Number(emp?.basicSalary || 0) : 0;
          await tx.projectEmployee.upsert({
            where: {
              projectId_employeeId: {
                projectId: p.id,
                employeeId: member.id
              }
            },
            update: {},
            create: {
              projectId: p.id,
              employeeId: member.id,
              rate,
              paidAmount: 0,
              isProjectBased
            }
          });
        }
      }

      // Record Advance Payment if provided
      if (parsedAdvance > 0) {
        await tx.projectPayment.create({
          data: {
            projectId: p.id,
            amount: parsedAdvance,
            paymentMethod: "Bank Transfer",
            notes: "Initial advance payment received upon project creation",
            paidToStaff: 0,
            profit: parsedAdvance
          }
        });

        const formattedAdvance = Number(parsedAdvance).toLocaleString('en-US');
        const incomeDesc = `${trimmedName}: ${formattedAdvance} Advance`;

        const income = await tx.income.create({
          data: {
            companyId,
            projectId: p.id,
            category: "Advance Payment",
            source: trimmedName,
            amount: parsedAdvance,
            received: parsedAdvance,
            paymentStatus: "PAID",
            shareable: true,
            description: incomeDesc,
            systemSource: "ERP"
          }
        });

        await createLedgerEntry({
          companyId,
          module: "Income",
          referenceId: income.id,
          amount: parsedAdvance,
          isDebit: true,
          accountType: "Bank Transfer",
          description: `Income: ${incomeDesc}`,
          createdById: session.user.id,
          systemSource: "ERP"
        });
      }

      // Safely log activity if performing user exists in User table
      const performingUser = await tx.user.findUnique({
        where: { id: session.user.id }
      });

      if (performingUser) {
        await tx.projectActivity.create({
          data: {
            companyId,
            projectId: p.id,
            type: "PROJECT_CREATED",
            description: `Project ${trimmedCode} created`,
            performedById: session.user.id
          }
        });

        if (parsedAdvance > 0) {
          await tx.projectActivity.create({
            data: {
              companyId,
              projectId: p.id,
              type: "PAYMENT_RECORDED",
              description: `Initial advance payment of ৳${parsedAdvance.toLocaleString()} recorded`,
              performedById: session.user.id
            }
          });
        }

        if (validManagerId) {
          await tx.projectActivity.create({
            data: {
              companyId,
              projectId: p.id,
              type: "PROJECT_UPDATED",
              description: "Manager assigned",
              newValue: validManagerId,
              performedById: session.user.id
            }
          });
        }
      }

      // -------------------------------------------------------------
      // NOTIFICATIONS: Notify manager and team members of assignment
      // -------------------------------------------------------------
      const assignedEmployeeIds = new Set<string>();
      if (validManagerId) assignedEmployeeIds.add(validManagerId);
      validTeamMembers.forEach(m => assignedEmployeeIds.add(m.id));

      if (assignedEmployeeIds.size > 0) {
        const employeesToNotify = await tx.employee.findMany({
          where: { id: { in: Array.from(assignedEmployeeIds) }, companyId, userId: { not: null } },
          select: { userId: true, id: true }
        });

        if (employeesToNotify.length > 0) {
          const notifications = employeesToNotify
            .filter(emp => !!emp.userId)
            .map(emp => ({
              companyId,
              userId: emp.userId!,
              title: "New Project Assignment",
              message: `You have been assigned to project: ${trimmedName} (${trimmedCode})`,
              category: "SYSTEM",
              priority: "NORMAL",
              status: "UNREAD",
              link: `/erp/projects/${p.id}`
            }));
          if (notifications.length > 0) {
            await tx.notification.createMany({ data: notifications });
          }
        }
      }

      return p;
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "COMPANY_REQUIRED" || error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST Project Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
