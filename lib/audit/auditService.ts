import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";

export interface LogAuditParams {
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  description?: string;
  beforeValue?: Record<string, any> | string | null;
  afterValue?: Record<string, any> | string | null;
  status?: "SUCCESS" | "FAILED";
}

const SENSITIVE_KEYS = ["password", "token", "secret", "apikey", "authorization"];

/**
 * Recursively masks sensitive fields in an object or stringified JSON payload.
 */
function maskSensitiveData(payload: any): any {
  if (!payload) return payload;

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(maskSensitiveData(parsed));
    } catch {
      return payload; // Not a JSON string, leave as is
    }
  }

  if (Array.isArray(payload)) {
    return payload.map(maskSensitiveData);
  }

  if (typeof payload === "object") {
    const maskedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        maskedObj[key] = "[MASKED]";
      } else {
        maskedObj[key] = maskSensitiveData(value);
      }
    }
    return maskedObj;
  }

  return payload;
}

/**
 * Creates a global audit log entry.
 * Safely masks secrets and fetches IP/User-Agent from Next.js headers.
 */
export async function logAudit({
  module,
  entityType,
  entityId,
  action,
  description,
  beforeValue,
  afterValue,
  status = "SUCCESS",
}: LogAuditParams) {
  try {
    const companyId = await getCompanyId().catch(() => null);
    if (!companyId) return null; // We only log tenant-specific events right now.

    const session = await getSession();
    const userId = session?.user?.id;

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null;
    const userAgent = headersList.get("user-agent") || null;

    const maskedBefore = beforeValue ? JSON.stringify(maskSensitiveData(beforeValue)) : null;
    const maskedAfter = afterValue ? JSON.stringify(maskSensitiveData(afterValue)) : null;

    const audit = await prisma.globalAuditLog.create({
      data: {
        companyId,
        userId: userId || null,
        module,
        entityType,
        entityId,
        action,
        description,
        beforeValue: maskedBefore,
        afterValue: maskedAfter,
        ipAddress,
        userAgent,
        status,
      },
    });

    return audit;
  } catch (error) {
    console.error("GlobalAuditLog failed to write:", error);
    // Silent fail so we don't break the main business logic if the logger dies
    return null; 
  }
}
