import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

// Baseline feature flags to seed if none exist in the database
const DEFAULT_FEATURE_FLAGS = [
  {
    key: "AI_CO_PILOT_ANALYTICS",
    description: "Generative AI Financial Copilot for automated ledger variance explanation and forecasting.",
    isEnabled: true,
    rolloutPercentage: 100,
    enabledCompanyIds: [],
  },
  {
    key: "ADVANCED_PAYROLL_ENGINE",
    description: "Enterprise tier multi-tier payroll rules, overtime formulas, and automated tax withholding.",
    isEnabled: true,
    rolloutPercentage: 80,
    enabledCompanyIds: [],
  },
  {
    key: "WHATSAPP_BILLING_DISPATCH",
    description: "Direct WhatsApp Business API bridge for instant invoice dispatch and payment link reminders.",
    isEnabled: true,
    rolloutPercentage: 50,
    enabledCompanyIds: [],
  },
  {
    key: "MULTI_CURRENCY_HEDGING",
    description: "Real-time foreign exchange auto-revaluation and FX gain/loss journalizing for multi-currency companies.",
    isEnabled: false,
    rolloutPercentage: 0,
    enabledCompanyIds: [],
  },
  {
    key: "REALTIME_TELEMETRY_DASHBOARD",
    description: "Ultra high-frequency WebSocket streaming for live invoice reconciliation & cashier cash flow stats.",
    isEnabled: true,
    rolloutPercentage: 100,
    enabledCompanyIds: [],
  },
  {
    key: "AUTOMATED_TAX_COMPLIANCE",
    description: "Automated NBR / VAT-16 tax summary generation and e-challan integration module.",
    isEnabled: false,
    rolloutPercentage: 25,
    enabledCompanyIds: [],
  },
  {
    key: "BETA_PROJECT_GANTT",
    description: "Interactive Gantt chart timeline and milestone resource allocation engine for ERP Projects.",
    isEnabled: true,
    rolloutPercentage: 60,
    enabledCompanyIds: [],
  },
];

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const status = searchParams.get("status") || "";

    const [existingFlags, companies] = await Promise.all([
      prisma.featureFlag.findMany({
        orderBy: { createdAt: "desc" },
      }).catch(() => []),
      prisma.company.findMany({
        select: { id: true, name: true, businessType: true },
        orderBy: { name: "asc" },
      }).catch(() => []),
    ]);

    let flags = existingFlags;

    // Seed defaults if table is empty
    if (flags.length === 0) {
      try {
        for (const defaultFlag of DEFAULT_FEATURE_FLAGS) {
          const created = await prisma.featureFlag.create({
            data: defaultFlag,
          });
          flags.push(created);
        }
      } catch (seedErr) {
        console.warn("Could not seed default flags to DB, using memory fallback:", seedErr);
        flags = DEFAULT_FEATURE_FLAGS.map((f, idx) => ({
          id: `seed-flag-${idx + 1}`,
          ...f,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as any[];
      }
    }

    // Filter
    const filteredFlags = flags.filter((flag) => {
      const matchSearch =
        !search ||
        flag.key.toLowerCase().includes(search) ||
        (flag.description && flag.description.toLowerCase().includes(search));

      const matchStatus =
        !status ||
        (status === "ACTIVE" && flag.isEnabled) ||
        (status === "INACTIVE" && !flag.isEnabled) ||
        (status === "CANARY" && flag.isEnabled && (flag.rolloutPercentage < 100 || (flag.enabledCompanyIds && flag.enabledCompanyIds.length > 0)));

      return matchSearch && matchStatus;
    });

    const totalFlags = flags.length;
    const activeFlags = flags.filter((f) => f.isEnabled).length;
    const canaryRollouts = flags.filter((f) => f.isEnabled && (f.rolloutPercentage < 100 || (f.enabledCompanyIds && f.enabledCompanyIds.length > 0))).length;
    const targetedTenantsCount = new Set(flags.flatMap((f) => f.enabledCompanyIds || [])).size;

    return NextResponse.json({
      flags: filteredFlags,
      companies,
      metrics: {
        totalFlags,
        activeFlags,
        canaryRollouts,
        targetedTenantsCount,
      },
    });
  } catch (error: any) {
    console.error("GET System Feature Flags Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { key, description, isEnabled = false, rolloutPercentage = 100, enabledCompanyIds = [] } = body;

    if (!key || !key.trim()) {
      return NextResponse.json({ error: "Feature flag key is required" }, { status: 400 });
    }

    const formattedKey = key.trim().toUpperCase().replace(/\s+/g, "_");

    const existing = await prisma.featureFlag.findUnique({
      where: { key: formattedKey },
    });

    if (existing) {
      return NextResponse.json({ error: `Feature flag with key '${formattedKey}' already exists.` }, { status: 400 });
    }

    const newFlag = await prisma.featureFlag.create({
      data: {
        key: formattedKey,
        description: description?.trim() || null,
        isEnabled: Boolean(isEnabled),
        rolloutPercentage: Math.max(0, Math.min(100, Number(rolloutPercentage) || 0)),
        enabledCompanyIds: Array.isArray(enabledCompanyIds) ? enabledCompanyIds : [],
      },
    });

    return NextResponse.json({ success: true, flag: newFlag }, { status: 201 });
  } catch (error: any) {
    console.error("POST System Feature Flag Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { id, key, description, isEnabled, rolloutPercentage, enabledCompanyIds } = body;

    if (!id) {
      return NextResponse.json({ error: "Feature flag ID is required" }, { status: 400 });
    }

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: {
        ...(key && { key: key.trim().toUpperCase().replace(/\s+/g, "_") }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
        ...(rolloutPercentage !== undefined && { rolloutPercentage: Math.max(0, Math.min(100, Number(rolloutPercentage) || 0)) }),
        ...(enabledCompanyIds !== undefined && { enabledCompanyIds: Array.isArray(enabledCompanyIds) ? enabledCompanyIds : [] }),
      },
    });

    return NextResponse.json({ success: true, flag: updated });
  } catch (error: any) {
    console.error("PUT System Feature Flag Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Feature flag ID is required" }, { status: 400 });
    }

    await prisma.featureFlag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE System Feature Flag Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
