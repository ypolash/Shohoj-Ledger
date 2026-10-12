import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { runOfficeOff } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const rbacGuard = await requirePermission("ATTENDANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetDate, backfillPastDays, source } = body;

    const result = await runOfficeOff(companyId, {
      targetDate,
      backfillPastDays: backfillPastDays !== undefined ? Number(backfillPastDays) : undefined,
      source: source || "MANUAL"
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Office Off execution error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute office off" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config: any = await (prisma.attendanceConfig as any).findFirst({
      where: { companyId }
    });

    const compSetting = await prisma.companySetting.findUnique({
      where: { companyId }
    });

    const url = new URL(req.url);
    const triggerAuto = url.searchParams.get("trigger") === "auto" || url.searchParams.get("checkAuto") === "1";

    let timezone = compSetting?.timezone || "Asia/Dhaka";
    if (!timezone || timezone === "UTC" || timezone === "UTC / GMT") timezone = "Asia/Dhaka";
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      timezone = "Asia/Dhaka";
    }

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const currentTimeStr = timeFormatter.format(now); // e.g. "18:30"

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const todayStr = dateFormatter.format(now);

    const targetTime = config?.autoOfficeOffTime || config?.shiftEnd || "20:00";
    const isPastTriggerTime = currentTimeStr >= targetTime;

    let executedToday = false;
    if (config?.lastOfficeOffRun) {
      const lastRunStr = dateFormatter.format(new Date(config.lastOfficeOffRun));
      if (lastRunStr === todayStr) {
        executedToday = true;
      }
    }

    // Auto-execute if enabled, time reached, and not yet run today
    if (triggerAuto && config?.autoOfficeOff && isPastTriggerTime && !executedToday) {
      const autoResult = await runOfficeOff(companyId, {
        targetDate: todayStr,
        backfillPastDays: config.autoBackfillPastDays || 30,
        source: "AUTO"
      });

      return NextResponse.json({
        autoExecuted: true,
        currentTime: currentTimeStr,
        triggerTime: targetTime,
        result: autoResult,
        config
      });
    }

    const shiftStartTime = config?.shiftStart || compSetting?.shiftStartTime || "09:00";

    return NextResponse.json({
      currentTime: currentTimeStr,
      targetDate: todayStr,
      shiftStartTime,
      triggerTime: targetTime,
      autoOfficeOff: !!config?.autoOfficeOff,
      autoBackfillPastDays: config?.autoBackfillPastDays ?? 30,
      lastOfficeOffRun: config?.lastOfficeOffRun,
      isPastTriggerTime,
      executedToday,
      isOfficeStoppedForToday: executedToday,
      nextWorkDayStatus: "AUTOMATIC_OPEN_NEXT_SHIFT"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
