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
  let quotaModel: "ANNUAL" | "MONTHLY" | "DAILY" | "SHORT_BREAK" = "ANNUAL";
  let cleanDesc = type?.description || "";
  let breakDurationMinutes = 30;
  let gracePeriodMinutes = 5;
  let fineAmount = 50;
  let fineType: "FIXED" | "PER_MINUTE" = "FIXED";
  let autoFine = true;
  let maxPerDay = 2;
  let isShortBreak = false;

  if (type?.description) {
    const timerMatch = type.description.match(/^\[TIMER_CONFIG:({.*?})\]\s*(.*)$/s);
    if (timerMatch) {
      try {
        const parsed = JSON.parse(timerMatch[1]);
        quotaModel = "SHORT_BREAK";
        isShortBreak = true;
        if (parsed.duration !== undefined && parsed.duration !== null && !isNaN(Number(parsed.duration))) {
          breakDurationMinutes = Number(parsed.duration);
        }
        if (parsed.grace !== undefined && parsed.grace !== null && !isNaN(Number(parsed.grace))) {
          gracePeriodMinutes = Number(parsed.grace);
        }
        if (parsed.fine !== undefined && parsed.fine !== null && !isNaN(Number(parsed.fine))) {
          fineAmount = Number(parsed.fine);
        }
        fineType = parsed.fineType === "PER_MINUTE" ? "PER_MINUTE" : "FIXED";
        autoFine = parsed.autoFine !== false;
        if (parsed.maxPerDay !== undefined && parsed.maxPerDay !== null && !isNaN(Number(parsed.maxPerDay))) {
          maxPerDay = Number(parsed.maxPerDay);
        }
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
  } else if (type?.name && type.name.toLowerCase().includes("break")) {
    quotaModel = "SHORT_BREAK";
    isShortBreak = true;
  }

  return {
    ...(type || {}),
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
    const duration = timerConfig?.breakDurationMinutes !== undefined && timerConfig?.breakDurationMinutes !== "" && !isNaN(Number(timerConfig?.breakDurationMinutes))
      ? Number(timerConfig?.breakDurationMinutes)
      : 30;
    const grace = timerConfig?.gracePeriodMinutes !== undefined && timerConfig?.gracePeriodMinutes !== "" && !isNaN(Number(timerConfig?.gracePeriodMinutes))
      ? Number(timerConfig?.gracePeriodMinutes)
      : 5;
    const fine = timerConfig?.fineAmount !== undefined && timerConfig?.fineAmount !== "" && !isNaN(Number(timerConfig?.fineAmount))
      ? Number(timerConfig?.fineAmount)
      : 50;
    const fineType = timerConfig?.fineType === "PER_MINUTE" ? "PER_MINUTE" : "FIXED";
    const autoFine = timerConfig?.autoFine !== false;
    const maxPerDay = timerConfig?.maxPerDay !== undefined && timerConfig?.maxPerDay !== "" && !isNaN(Number(timerConfig?.maxPerDay))
      ? Number(timerConfig?.maxPerDay)
      : 2;

    const configStr = JSON.stringify({
      duration,
      grace,
      fine,
      fineType,
      autoFine,
      maxPerDay,
    });
    return clean ? `[TIMER_CONFIG:${configStr}] ${clean}` : `[TIMER_CONFIG:${configStr}]`;
  }

  return clean ? `[QUOTA:${model}] ${clean}` : `[QUOTA:${model}]`;
}

export async function getActiveBreakForEmployee(employeeId: string, companyId?: string | null) {
  try {
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

    if (!activeLeaves || activeLeaves.length === 0) return null;
    const leave = activeLeaves[0];

    let leaveTypeObj = leave.leaveType;
    if (!leaveTypeObj && leave.companyId) {
      leaveTypeObj = await prisma.leaveType.findFirst({
        where: {
          companyId: leave.companyId,
          OR: [
            { name: { equals: leave.type, mode: "insensitive" } },
            { id: leave.leaveTypeId || "" }
          ]
        }
      });
    }

    const parsedType = parseLeaveTypeConfig(leaveTypeObj || { name: leave.type, description: leave.comments });
    const isShortBreak = Boolean(
      parsedType?.isShortBreak ||
      parsedType?.quotaModel === "SHORT_BREAK" ||
      leave.type?.toLowerCase().includes("break") ||
      (leave.comments && leave.comments.includes("Short Break"))
    );

    if (!isShortBreak) {
      return null;
    }

    const startTime = new Date(leave.startDate || leave.createdAt);
    const durationMs = (parsedType?.breakDurationMinutes || 30) * 60 * 1000;
    const graceMs = (parsedType?.gracePeriodMinutes || 5) * 60 * 1000;
    const targetEndTime = new Date(startTime.getTime() + durationMs);
    const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

    const nowMs = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((targetEndTime.getTime() - nowMs) / 1000));
    const isOverstayed = nowMs > graceEndTime.getTime();
    const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
    const overstayMinutes = Math.ceil(overstaySeconds / 60);

    let estimatedFine = 0;
    if (isOverstayed && (parsedType?.fineAmount || 0) > 0) {
      if (parsedType?.fineType === "PER_MINUTE") {
        estimatedFine = (parsedType.fineAmount || 50) * overstayMinutes;
      } else {
        estimatedFine = parsedType?.fineAmount || 50;
      }
    }

    return {
      leaveId: leave.id,
      type: leave.type,
      status: leave.status,
      startTime: startTime.toISOString(),
      targetEndTime: targetEndTime.toISOString(),
      graceEndTime: graceEndTime.toISOString(),
      durationMinutes: parsedType?.breakDurationMinutes || 30,
      gracePeriodMinutes: parsedType?.gracePeriodMinutes || 5,
      fineAmount: parsedType?.fineAmount || 50,
      fineType: parsedType?.fineType || "FIXED",
      autoFine: parsedType?.autoFine !== false,
      remainingSeconds,
      isOverstayed,
      overstayMinutes,
      estimatedFine,
    };
  } catch (error) {
    console.error("[getActiveBreakForEmployee] error:", error);
    return null;
  }
}

export async function processBreakEnd(leaveId: string, employeeId: string, companyId?: string | null) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId },
    include: { leaveType: true },
  });

  if (!leave) {
    throw new Error("Active break request not found");
  }

  let leaveTypeObj = leave.leaveType;
  if (!leaveTypeObj && leave.companyId) {
    leaveTypeObj = await prisma.leaveType.findFirst({
      where: {
        companyId: leave.companyId,
        OR: [
          { name: { equals: leave.type, mode: "insensitive" } },
          { id: leave.leaveTypeId || "" }
        ]
      }
    });
  }

  const parsedType = parseLeaveTypeConfig(leaveTypeObj || { name: leave.type, description: leave.comments });
  const startTime = new Date(leave.startDate || leave.createdAt);
  const durationMs = (parsedType?.breakDurationMinutes || 30) * 60 * 1000;
  const graceMs = (parsedType?.gracePeriodMinutes || 5) * 60 * 1000;
  const targetEndTime = new Date(startTime.getTime() + durationMs);
  const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

  const nowMs = Date.now();
  const isOverstayed = nowMs > graceEndTime.getTime();
  const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
  const overstayMinutes = Math.ceil(overstaySeconds / 60);

  let fineApplied = false;
  let fineAmount = 0;

  if (isOverstayed && (parsedType?.fineAmount || 0) > 0 && parsedType?.autoFine !== false) {
    fineAmount = parsedType?.fineType === "PER_MINUTE" ? (parsedType.fineAmount || 50) * overstayMinutes : (parsedType?.fineAmount || 50);

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
          reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${parsedType?.breakDurationMinutes || 30}m + ${parsedType?.gracePeriodMinutes || 5}m grace) [Req: ${leave.id.substring(0, 8)}]`,
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
