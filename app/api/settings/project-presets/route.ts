import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { PROJECT_PRESETS, ProjectPresetId } from "@/lib/projects/projectPresets";

export async function GET() {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    if (!companyId) {
      return NextResponse.json({
        success: true,
        defaultPreset: "video_agency",
        customConfigs: {},
        presets: Object.values(PROJECT_PRESETS)
      });
    }

    const [defaultSetting, customConfigSetting] = await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: `project_default_preset_${companyId}` }
      }),
      prisma.systemSetting.findUnique({
        where: { key: `project_custom_preset_config_${companyId}` }
      })
    ]);

    const defaultPreset = (defaultSetting?.value as ProjectPresetId) || "video_agency";
    let customConfigs = {};
    if (customConfigSetting?.value) {
      try {
        customConfigs = JSON.parse(customConfigSetting.value);
      } catch (e) {
        customConfigs = {};
      }
    }

    return NextResponse.json({
      success: true,
      defaultPreset,
      customConfigs,
      presets: Object.values(PROJECT_PRESETS)
    });
  } catch (error: any) {
    console.error("GET Project Presets Settings Error:", error);
    return NextResponse.json({
      success: true,
      defaultPreset: "video_agency",
      customConfigs: {},
      presets: Object.values(PROJECT_PRESETS)
    });
  }
}

export async function PUT(req: Request) {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      companyId = null;
    }

    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { defaultPreset, customConfig, presetId } = body;

    // 1. Update default preset if provided
    if (defaultPreset && PROJECT_PRESETS[defaultPreset as ProjectPresetId]) {
      await prisma.systemSetting.upsert({
        where: { key: `project_default_preset_${companyId}` },
        update: {
          value: defaultPreset,
          description: "Company default project structure preset ID"
        },
        create: {
          key: `project_default_preset_${companyId}`,
          value: defaultPreset,
          description: "Company default project structure preset ID"
        }
      });
    }

    // 2. Update custom configuration if provided
    if (presetId && customConfig) {
      const existingSetting = await prisma.systemSetting.findUnique({
        where: { key: `project_custom_preset_config_${companyId}` }
      });

      let currentConfigs: Record<string, any> = {};
      if (existingSetting?.value) {
        try {
          currentConfigs = JSON.parse(existingSetting.value);
        } catch {
          currentConfigs = {};
        }
      }

      currentConfigs[presetId] = customConfig;

      await prisma.systemSetting.upsert({
        where: { key: `project_custom_preset_config_${companyId}` },
        update: {
          value: JSON.stringify(currentConfigs),
          description: "Custom project structure overrides & fields"
        },
        create: {
          key: `project_custom_preset_config_${companyId}`,
          value: JSON.stringify(currentConfigs),
          description: "Custom project structure overrides & fields"
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Project structure preset updated successfully."
    });
  } catch (error: any) {
    console.error("PUT Project Presets Settings Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
