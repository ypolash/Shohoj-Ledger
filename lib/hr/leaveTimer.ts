import { prisma } from "@/lib/prisma";

export interface LeaveTimerConfig {
  quotaModel: "ANNUAL" | "MONTHLY" | "DAILY" | "SHORT_BREAK";
  isShortBreak: boolean;
  breakDurationMinutes: number;
  gracePeriodMinutes: number;
  fineAmount: number;
  fineType: "FIXED" | "PER_MINUTE";
  autoFine: boolean;
  maxPerDay: number;
  displayDescription: string;
}

export function parseLeaveTypeConfig(type: any): any {
  if (!type) return type;
  let quotaModel: "ANNUAL" | "MONTHLY" | "DAILY" | "SHORT_BREAK" = "ANNUAL";
  let cleanDesc = type.description || "";
  let breakDurationMinutes = 30;
  let gracePeriodMinutes = 5;
  let fineAmount = 50;
  let fineType: "FIXED" | "PER_MINUTE" = "FIXED";
  let autoFine = true;
  let maxPerDay = 2;
  let isShortBreak = false;

  if (type.description) {
    const timerMatch = type.description.match(/^\[TIMER_CONFIG:({.*?})\]\s*(.*)$/s);
    if (timerMatch) {
      try {
        const parsed = JSON.parse(timerMatch[1]);
        quotaModel = "SHORT_BREAK";
        isShortBreak = true;
        breakDurationMinutes = Number(parsed.duration) || 30;
        gracePeriodMinutes = Number(parsed.grace) || 5;
        fineAmount = Number(parsed.fine) || 50;
        fineType = parsed.fineType === "PER_MINUTE" ? "PER_MINUTE" : "FIXED";
        autoFine = parsed.autoFine !== false;
        maxPerDay = Number(parsed.maxPerDay) || 2;
        cleanDesc = timerMatch[2] || "";
      } catch {
        // fallback
      }
    } else if (type.description.startsWith("[QUOTA:")) {
      const match = type.description.match(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY|SHORT_BREAK)\]\s*(.*)$/s);
      if (match) {
        quotaModel = match[1] as any;
        isShortBreak = quotaModel === "SHORT_BREAK";
        cleanDesc = match[2] || "";
      }
    }
  }

  return {
    ...type,
    quotaModel,
    isShortBreak,
    displayDescription: cleanDesc,
    breakDurationMinutes,
    gracePeriodMinutes,
    fineAmount,
    fineType,
    autoFine,
    maxPerDay,
  };
}

export function encodeLeaveTypeConfig(
  description?: string | null,
  quotaModel?: string,
  timerConfig?: {
    breakDurationMinutes?: number | string;
    gracePeriodMinutes?: number | string;
    fineAmount?: number | string;
    fineType?: string;
    autoFine?: boolean;
    maxPerDay?: number | string;
  }
) {
  const model = quotaModel && ["ANNUAL", "MONTHLY", "DAILY", "SHORT_BREAK"].includes(quotaModel) ? quotaModel : "ANNUAL";
  const clean = description
    ? description
        .replace(/^\[TIMER_CONFIG:{.*?}\]\s*/s, "")
        .replace(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY|SHORT_BREAK)\]\s*/s, "")
        .trim()
    : "";

  if (model === "SHORT_BREAK") {
    const configStr = JSON.stringify({
      duration: Number(timerConfig?.breakDurationMinutes) || 30,
      grace: Number(timerConfig?.gracePeriodMinutes) || 5,
      fine: Number(timerConfig?.fineAmount) || 50,
      fineType: timerConfig?.fineType === "PER_MINUTE" ? "PER_MINUTE" : "FIXED",
      autoFine: timerConfig?.autoFine !== false,
      maxPerDay: Number(timerConfig?.maxPerDay) || 2,
    });
    return clean ? `[TIMER_CONFIG:${configStr}] ${clean}` : `[TIMER_CONFIG:${configStr}]`;
  }

  return clean ? `[QUOTA:${model}] ${clean}` : `[QUOTA:${model}]`;
}

export async function getActiveBreakForEmployee(employeeId: string, companyId?: string | null) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const whereClause: any = {
    employeeId,
    status: { in: ["APPROVED", "IN_PROGRESS", "ACTIVE"] },
    createdAt: { gte: startOfDay },
  };
  if (companyId) whereClause.companyId = companyId;

  const activeLeaves = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: { leaveType: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (activeLeaves.length === 0) return null;
  const leave = activeLeaves[0];
  const parsedType = parseLeaveTypeConfig(leave.leaveType);

  if (!parsedType.isShortBreak && parsedType.quotaModel !== "SHORT_BREAK") {
    return null;
  }

  const startTime = new Date(leave.startDate || leave.createdAt);
  const durationMs = (parsedType.breakDurationMinutes || 30) * 60 * 1000;
  const graceMs = (parsedType.gracePeriodMinutes || 5) * 60 * 1000;
  const targetEndTime = new Date(startTime.getTime() + durationMs);
  const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

  const nowMs = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((targetEndTime.getTime() - nowMs) / 1000));
  const isOverstayed = nowMs > graceEndTime.getTime();
  const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
  const overstayMinutes = Math.ceil(overstaySeconds / 60);

  let estimatedFine = 0;
  if (isOverstayed && parsedType.fineAmount > 0) {
    if (parsedType.fineType === "PER_MINUTE") {
      estimatedFine = parsedType.fineAmount * overstayMinutes;
    } else {
      estimatedFine = parsedType.fineAmount;
    }
  }

  return {
    leaveId: leave.id,
    type: leave.type,
    status: leave.status,
    startTime: startTime.toISOString(),
    targetEndTime: targetEndTime.toISOString(),
    graceEndTime: graceEndTime.toISOString(),
    durationMinutes: parsedType.breakDurationMinutes,
    gracePeriodMinutes: parsedType.gracePeriodMinutes,
    fineAmount: parsedType.fineAmount,
    fineType: parsedType.fineType,
    autoFine: parsedType.autoFine,
    remainingSeconds,
    isOverstayed,
    overstayMinutes,
    estimatedFine,
  };
}

export async function processBreakEnd(leaveId: string, employeeId: string, companyId?: string | null) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId },
    include: { leaveType: true },
  });

  if (!leave) {
    throw new Error("Active break request not found");
  }

  const parsedType = parseLeaveTypeConfig(leave.leaveType);
  const startTime = new Date(leave.startDate || leave.createdAt);
  const durationMs = (parsedType.breakDurationMinutes || 30) * 60 * 1000;
  const graceMs = (parsedType.gracePeriodMinutes || 5) * 60 * 1000;
  const targetEndTime = new Date(startTime.getTime() + durationMs);
  const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

  const nowMs = Date.now();
  const isOverstayed = nowMs > graceEndTime.getTime();
  const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
  const overstayMinutes = Math.ceil(overstaySeconds / 60);

  let fineApplied = false;
  let fineAmount = 0;

  if (isOverstayed && parsedType.fineAmount > 0 && parsedType.autoFine) {
    fineAmount = parsedType.fineType === "PER_MINUTE" ? parsedType.fineAmount * overstayMinutes : parsedType.fineAmount;

    // Check if fine already exists
    const existingFine = await prisma.employeeFine.findFirst({
      where: {
        employeeId,
        companyId: leave.companyId || companyId || "",
        reason: { contains: `Short Break (${leave.id.substring(0, 8)})` }
      }
    });

    if (!existingFine) {
      await prisma.employeeFine.create({
        data: {
          companyId: leave.companyId || companyId || "",
          employeeId,
          amount: fineAmount,
          reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${parsedType.breakDurationMinutes}m + ${parsedType.gracePeriodMinutes}m grace) [Req: ${leave.id.substring(0, 8)}]`,
          date: new Date(),
          status: "PENDING",
          systemSource: "MOBILE"
        }
      });
      fineApplied = true;
    }
  }

  await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: isOverstayed ? "OVERSTAYED" : "COMPLETED",
      comments: isOverstayed
        ? `Break ended. Overstayed by ${overstayMinutes} min(s). Fine: ৳${fineAmount}.`
        : "Break completed within time limit."
    }
  });

  return {
    success: true,
    isOverstayed,
    overstayMinutes,
    fineApplied,
    fineAmount,
  };
}
