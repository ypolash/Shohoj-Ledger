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
    const timerMatch = type.description.match(/^\[TIMER_CONFIG:({[\s\S]*?})\]\s*([\s\S]*)$/);
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
      const match = type.description.match(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY|SHORT_BREAK)\]\s*([\s\S]*)$/);
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
        .replace(/^\[TIMER_CONFIG:{[\s\S]*?}\]\s*/, "")
        .replace(/^\[QUOTA:(ANNUAL|MONTHLY|DAILY|SHORT_BREAK)\]\s*/, "")
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

export interface PauseState {
  remainingSeconds: number;
  consumedSeconds: number;
  pausedAt: string;
}

export function parsePauseState(comments?: string | null): PauseState | null {
  if (!comments) return null;
  const match = comments.match(/\[PAUSE_STATE:({[\s\S]*?})\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        remainingSeconds: Number(parsed.remainingSeconds) || 0,
        consumedSeconds: Number(parsed.consumedSeconds) || 0,
        pausedAt: parsed.pausedAt || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
  return null;
}

export async function getActiveBreakForEmployee(employeeId: string, companyId?: string | null) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const whereClause: any = {
      employeeId,
      status: { in: ["APPROVED", "IN_PROGRESS", "ACTIVE", "PAUSED"] },
      createdAt: { gte: startOfDay },
    };
    if (companyId) whereClause.companyId = companyId;

    const activeLeaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: { 
        leaveType: true,
        employee: {
          include: {
            workShift: true
          }
        }
      },
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
      (leave.comments && (leave.comments.includes("Short Break") || leave.comments.includes("Lunch Break") || leave.comments.includes("TIMER_CONFIG")))
    );

    if (!isShortBreak) {
      return null;
    }

    const startTime = new Date(leave.startDate || leave.createdAt);
    
    // Determine configured duration and grace from employee workshift or parsed config
    const shiftBreakTime = leave.employee?.workShift?.breakTime && leave.employee.workShift.breakTime > 0
      ? leave.employee.workShift.breakTime
      : null;
    const shiftGracePeriod = leave.employee?.workShift?.gracePeriod && leave.employee.workShift.gracePeriod > 0
      ? leave.employee.workShift.gracePeriod
      : null;

    let durationMinutes = parsedType?.breakDurationMinutes || shiftBreakTime || 60;
    if (leave.endDate && leave.startDate) {
      const explicitMinutes = Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (60 * 1000));
      if (explicitMinutes > 0) {
        durationMinutes = explicitMinutes;
      }
    }
    const gracePeriodMinutes = parsedType?.gracePeriodMinutes || shiftGracePeriod || 5;

    const durationMs = durationMinutes * 60 * 1000;
    const graceMs = gracePeriodMinutes * 60 * 1000;
    const targetEndTime = new Date(startTime.getTime() + durationMs);
    const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

    const isPaused = leave.status === "PAUSED";
    const pauseState = isPaused ? parsePauseState(leave.comments) : null;

    const nowMs = Date.now();
    let remainingSeconds = Math.max(0, Math.floor((targetEndTime.getTime() - nowMs) / 1000));
    let consumedSeconds = Math.max(0, Math.min(durationMinutes * 60, Math.floor((nowMs - startTime.getTime()) / 1000)));

    if (isPaused && pauseState) {
      remainingSeconds = pauseState.remainingSeconds;
      consumedSeconds = pauseState.consumedSeconds;
    }

    const isOverstayed = !isPaused && nowMs > graceEndTime.getTime();
    const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
    const overstayMinutes = Math.ceil(overstaySeconds / 60);

    const fineAmountBase = parsedType?.fineAmount || 50;
    let estimatedFine = 0;
    if (isOverstayed && fineAmountBase > 0) {
      if (parsedType?.fineType === "PER_MINUTE") {
        estimatedFine = fineAmountBase * overstayMinutes;
      } else {
        estimatedFine = fineAmountBase;
      }
    }

    // Auto-record or update penalty in EmployeeFine table if grace period is exceeded (only when active running)
    if (!isPaused && isOverstayed && (parsedType?.autoFine !== false) && estimatedFine > 0) {
      try {
        const leaveShortId = leave.id.substring(0, 8);
        const existingFine = await prisma.employeeFine.findFirst({
          where: {
            employeeId,
            companyId: leave.companyId || companyId || "",
            reason: { contains: `[Req: ${leaveShortId}]` }
          }
        });

        if (!existingFine) {
          await prisma.employeeFine.create({
            data: {
              companyId: leave.companyId || companyId || "",
              employeeId,
              amount: estimatedFine,
              reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${durationMinutes}m + ${gracePeriodMinutes}m grace) [Req: ${leaveShortId}]`,
              date: new Date(),
              status: "PENDING",
              systemSource: "MOBILE"
            }
          });
        } else if (existingFine.status === "PENDING" && Number(existingFine.amount) !== estimatedFine) {
          await prisma.employeeFine.update({
            where: { id: existingFine.id },
            data: {
              amount: estimatedFine,
              reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${durationMinutes}m + ${gracePeriodMinutes}m grace) [Req: ${leaveShortId}]`,
            }
          });
        }
      } catch (fineErr) {
        console.error("[getActiveBreakForEmployee] Error creating/updating auto-fine:", fineErr);
      }
    }

    return {
      leaveId: leave.id,
      type: leave.type,
      status: isPaused ? "PAUSED" : (isOverstayed ? "OVERSTAYED" : leave.status),
      isBreakActive: true,
      isPaused,
      startTime: startTime.toISOString(),
      targetEndTime: targetEndTime.toISOString(),
      graceEndTime: graceEndTime.toISOString(),
      durationMinutes,
      totalDurationMinutes: durationMinutes,
      gracePeriodMinutes,
      fineAmount: fineAmountBase,
      fineType: parsedType?.fineType || "FIXED",
      autoFine: parsedType?.autoFine !== false,
      remainingSeconds,
      consumedSeconds,
      isOverstayed,
      isOverstay: isOverstayed,
      overstayMinutes,
      estimatedFine,
    };
  } catch (error) {
    console.error("[getActiveBreakForEmployee] error:", error);
    return null;
  }
}

export async function processBreakPause(leaveId: string, employeeId: string, companyId?: string | null) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId },
    include: { 
      leaveType: true,
      employee: {
        include: {
          workShift: true
        }
      }
    },
  });

  if (!leave) {
    throw new Error("Active break request not found");
  }

  if (leave.status === "PAUSED") {
    const active = await getActiveBreakForEmployee(employeeId, companyId);
    return { success: true, activeBreak: active, message: "Break is already paused.", isPaused: true };
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
  
  const shiftBreakTime = leave.employee?.workShift?.breakTime && leave.employee.workShift.breakTime > 0
    ? leave.employee.workShift.breakTime
    : null;
  const shiftGracePeriod = leave.employee?.workShift?.gracePeriod && leave.employee.workShift.gracePeriod > 0
    ? leave.employee.workShift.gracePeriod
    : null;

  let durationMinutes = parsedType?.breakDurationMinutes || shiftBreakTime || 60;
  if (leave.endDate && leave.startDate) {
    const explicitMinutes = Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (60 * 1000));
    if (explicitMinutes > 0) {
      durationMinutes = explicitMinutes;
    }
  }

  const durationMs = durationMinutes * 60 * 1000;
  const targetEndTime = new Date(startTime.getTime() + durationMs);

  const nowMs = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((targetEndTime.getTime() - nowMs) / 1000));
  const consumedSeconds = Math.max(0, durationMinutes * 60 - remainingSeconds);

  const pauseStateJson = JSON.stringify({
    remainingSeconds,
    consumedSeconds,
    pausedAt: new Date().toISOString(),
  });

  const cleanComments = (leave.comments || "").replace(/\[PAUSE_STATE:({[\s\S]*?})\]\s*/g, "").trim();
  const updatedComments = `[PAUSE_STATE:${pauseStateJson}] ${cleanComments}`;

  await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: "PAUSED",
      comments: updatedComments
    }
  });

  const activeBreak = await getActiveBreakForEmployee(employeeId, companyId);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return {
    success: true,
    message: `Break paused. ${mins}m ${secs}s remaining preserved. Click Resume when ready to continue.`,
    activeBreak,
    isPaused: true
  };
}

export async function processBreakResume(leaveId: string, employeeId: string, companyId?: string | null) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId },
    include: { 
      leaveType: true,
      employee: {
        include: {
          workShift: true
        }
      }
    },
  });

  if (!leave) {
    throw new Error("Paused break request not found");
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
  const shiftBreakTime = leave.employee?.workShift?.breakTime && leave.employee.workShift.breakTime > 0
    ? leave.employee.workShift.breakTime
    : null;
  const durationMinutes = parsedType?.breakDurationMinutes || shiftBreakTime || 60;

  const pauseState = parsePauseState(leave.comments);
  const remainingSeconds = pauseState ? pauseState.remainingSeconds : Math.max(0, Math.floor((new Date(leave.endDate).getTime() - new Date(leave.updatedAt).getTime()) / 1000));
  const consumedSeconds = pauseState ? pauseState.consumedSeconds : Math.max(0, durationMinutes * 60 - remainingSeconds);

  const now = new Date();
  const targetEndTime = new Date(now.getTime() + remainingSeconds * 1000);
  const adjustedStartTime = new Date(now.getTime() - consumedSeconds * 1000);

  const cleanComments = (leave.comments || "").replace(/\[PAUSE_STATE:({[\s\S]*?})\]\s*/g, "").trim();

  await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: "APPROVED",
      startDate: adjustedStartTime,
      endDate: targetEndTime,
      comments: cleanComments
    }
  });

  const activeBreak = await getActiveBreakForEmployee(employeeId, companyId);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  return {
    success: true,
    message: `Break resumed with ${mins}m ${secs}s remaining countdown.`,
    activeBreak,
    isPaused: false
  };
}

export async function processBreakEnd(leaveId: string, employeeId: string, companyId?: string | null) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, employeeId },
    include: { 
      leaveType: true,
      employee: {
        include: {
          workShift: true
        }
      }
    },
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
  
  const shiftBreakTime = leave.employee?.workShift?.breakTime && leave.employee.workShift.breakTime > 0
    ? leave.employee.workShift.breakTime
    : null;
  const shiftGracePeriod = leave.employee?.workShift?.gracePeriod && leave.employee.workShift.gracePeriod > 0
    ? leave.employee.workShift.gracePeriod
    : null;

  let durationMinutes = parsedType?.breakDurationMinutes || shiftBreakTime || 60;
  if (leave.endDate && leave.startDate) {
    const explicitMinutes = Math.round((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (60 * 1000));
    if (explicitMinutes > 0) {
      durationMinutes = explicitMinutes;
    }
  }
  const gracePeriodMinutes = parsedType?.gracePeriodMinutes || shiftGracePeriod || 5;

  const durationMs = durationMinutes * 60 * 1000;
  const graceMs = gracePeriodMinutes * 60 * 1000;
  const targetEndTime = new Date(startTime.getTime() + durationMs);
  const graceEndTime = new Date(targetEndTime.getTime() + graceMs);

  const isPaused = leave.status === "PAUSED";
  const nowMs = Date.now();
  const isOverstayed = !isPaused && nowMs > graceEndTime.getTime();
  const overstaySeconds = isOverstayed ? Math.floor((nowMs - graceEndTime.getTime()) / 1000) : 0;
  const overstayMinutes = Math.ceil(overstaySeconds / 60);

  let fineApplied = false;
  let fineAmount = 0;
  const fineAmountBase = parsedType?.fineAmount || 50;

  if (isOverstayed && fineAmountBase > 0 && parsedType?.autoFine !== false) {
    fineAmount = parsedType?.fineType === "PER_MINUTE" ? fineAmountBase * overstayMinutes : fineAmountBase;

    const leaveShortId = leave.id.substring(0, 8);
    const existingFine = await prisma.employeeFine.findFirst({
      where: {
        employeeId,
        companyId: leave.companyId || companyId || "",
        reason: { contains: `[Req: ${leaveShortId}]` }
      }
    });

    if (!existingFine) {
      await prisma.employeeFine.create({
        data: {
          companyId: leave.companyId || companyId || "",
          employeeId,
          amount: fineAmount,
          reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${durationMinutes}m + ${gracePeriodMinutes}m grace) [Req: ${leaveShortId}]`,
          date: new Date(),
          status: "PENDING",
          systemSource: "MOBILE"
        }
      });
      fineApplied = true;
    } else {
      await prisma.employeeFine.update({
        where: { id: existingFine.id },
        data: {
          amount: fineAmount,
          reason: `Auto-Fine: Overstayed ${leave.type} by ${overstayMinutes}m (Allowed: ${durationMinutes}m + ${gracePeriodMinutes}m grace) [Req: ${leaveShortId}]`,
        }
      });
      fineApplied = true;
    }
  }

  const cleanComments = (leave.comments || "").replace(/\[PAUSE_STATE:({[\s\S]*?})\]\s*/g, "").trim();

  await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status: isOverstayed ? "OVERSTAYED" : "COMPLETED",
      comments: isOverstayed
        ? `Break ended. Overstayed by ${overstayMinutes} min(s). Penalty fine: ৳${fineAmount}. ${cleanComments}`
        : `Break completed within allocated ${durationMinutes}m limit. ${cleanComments}`
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
