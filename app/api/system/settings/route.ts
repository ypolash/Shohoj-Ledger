import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac/permissionGuard";

const DEFAULT_SETTINGS = [
  // General Platform
  { key: "PLATFORM_NAME", value: "Shohoj Ledger Cloud Enterprise", description: "Public brand name of the SaaS platform" },
  { key: "PLATFORM_URL", value: "https://app.shohojledger.com", description: "Primary master canonical URL" },
  { key: "SUPPORT_EMAIL", value: "support@shohojledger.com", description: "Global customer escalations contact email" },
  { key: "DEFAULT_CURRENCY", value: "BDT", description: "Default platform monetary currency code" },
  { key: "TIMEZONE", value: "Asia/Dhaka", description: "Standard platform timezone identifier" },
  { key: "MAINTENANCE_MODE", value: "false", description: "Locks down multi-tenant logins during system upgrades" },
  { key: "MAINTENANCE_NOTICE", value: "Scheduled system maintenance in progress. We will resume shortly.", description: "Public broadcast banner message" },

  // Security & Authentication
  { key: "MFA_POLICY", value: "MANDATORY_SUPER_ADMIN", description: "Multi-factor authentication enforcement policy" },
  { key: "SESSION_TIMEOUT_MINUTES", value: "60", description: "Inactive JWT session expiration timeout in minutes" },
  { key: "MAX_LOGIN_ATTEMPTS", value: "5", description: "Maximum failed attempts before rate-limit lock" },
  { key: "PASSWORD_MIN_LENGTH", value: "10", description: "Minimum character length for user credentials" },
  { key: "MULTI_TENANT_STRICT_ISOLATION", value: "true", description: "Hard database level schema/tenant query boundary enforcement" },

  // Email & Communication
  { key: "SMTP_HOST", value: "smtp.sendgrid.net", description: "Primary transactional email SMTP relay host" },
  { key: "SMTP_PORT", value: "587", description: "SMTP port (587 TLS or 465 SSL)" },
  { key: "SMTP_USER", value: "apikey", description: "SMTP username or API key identity" },
  { key: "SMTP_SENDER_NAME", value: "Shohoj Ledger Notifications", description: "Display name for transactional email dispatch" },
  { key: "SMTP_SENDER_EMAIL", value: "noreply@shohojledger.com", description: "Verified outbound email sender address" },
  { key: "WHATSAPP_ENABLED", value: "true", description: "WhatsApp Business API bridge for invoice reminders" },

  // Payment Gateways
  { key: "BKASH_MERCHANT_ENABLED", value: "true", description: "bKash checkout API integration" },
  { key: "BKASH_MODE", value: "live", description: "bKash environment (live or sandbox)" },
  { key: "NAGAD_MERCHANT_ENABLED", value: "true", description: "Nagad direct payment gateway" },
  { key: "STRIPE_BILLING_ENABLED", value: "true", description: "Stripe global credit card billing processor" },

  // API & Telemetry
  { key: "API_GLOBAL_RATE_LIMIT", value: "1000", description: "Requests per minute per tenant IP" },
  { key: "AUDIT_RETENTION_DAYS", value: "365", description: "Retention window for immutable global audit entries" },
  { key: "TELEMETRY_STREAMING", value: "true", description: "Real-time WebSocket health & metrics broadcasting" },
];

export async function GET(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    let settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    }).catch(() => []);

    if (settings.length === 0) {
      try {
        for (const def of DEFAULT_SETTINGS) {
          const created = await prisma.systemSetting.create({
            data: def,
          });
          settings.push(created);
        }
      } catch (seedErr) {
        console.warn("Could not seed settings in DB, using fallback:", seedErr);
        settings = DEFAULT_SETTINGS.map((d, idx) => ({
          id: `setting-${idx + 1}`,
          ...d,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as any[];
      }
    }

    // Convert list to a key-value dictionary for easy consumption
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      settings: settingsMap,
      rawList: settings,
      meta: {
        totalSettings: settings.length,
        lastUpdated: settings[0]?.updatedAt || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("GET System Settings Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("MANAGE_COMPANIES");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();

    // Check if bulk update
    if (body.settings && typeof body.settings === "object") {
      const updates = body.settings;
      const results = [];

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const stringVal = String(value);
          const upserted = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: stringVal },
            create: {
              key,
              value: stringVal,
              description: `Configuration key for ${key}`,
            },
          }).catch(() => null);

          if (upserted) results.push(upserted);
        }
      }

      return NextResponse.json({ success: true, updatedCount: results.length });
    }

    const { key, value, description } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing key or value" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value), ...(description && { description }) },
      create: { key, value: String(value), description: description || null },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error("POST System Settings Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
