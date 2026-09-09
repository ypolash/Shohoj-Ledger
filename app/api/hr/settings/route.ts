import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET() {
  const rbacGuard = await requirePermission("EMPLOYEE_VIEW");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Attendance Config (used by lib/attendance.ts and checkin engines)
    let attendanceConfig = await prisma.attendanceConfig.findFirst({
      where: { companyId }
    });

    if (!attendanceConfig) {
      attendanceConfig = await prisma.attendanceConfig.create({
        data: {
          companyId,
          shiftStart: "09:00",
          shiftEnd: "18:00",
          gracePeriod: 15,
          fridayOff: true,
          enablePunishmentDeduction: false
        }
      });
    }

    // 2. Company Setting (currency, timezone, workingDays, weeklyHolidays)
    let companySetting = await prisma.companySetting.findUnique({
      where: { companyId }
    });

    if (!companySetting) {
      companySetting = await prisma.companySetting.create({
        data: {
          companyId,
          currency: "BDT",
          timezone: "Asia/Dhaka",
          shiftStartTime: attendanceConfig.shiftStart || "09:00",
          shiftEndTime: attendanceConfig.shiftEnd || "18:00",
          gracePeriodMinutes: attendanceConfig.gracePeriod || 15,
          workingDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
          weeklyHolidays: ["Friday", "Saturday"]
        }
      });
    }

    // 3. Work Shifts
    const workShifts = await prisma.workShift.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 4. Punishment Rules (Late / Absent Penalties)
    const punishmentSettings = await prisma.punishmentSetting.findMany({
      where: { companyId },
      orderBy: [
        { type: "asc" },
        { fromMinutes: "asc" }
      ]
    });

    // 5. Allowed Office Networks (Wi-Fi SSID / BSSID / IP)
    const allowedNetworks = await prisma.allowedNetwork.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });

    // 6. Leave Types & Policies
    let leaveTypes = await prisma.leaveType.findMany({
      where: { companyId },
      include: { leavePolicies: true },
      orderBy: { createdAt: "asc" }
    });

    // If no leave types exist yet, auto-provision standard business types
    if (leaveTypes.length === 0) {
      const standardTypes = [
        { name: "Casual Leave", description: "Standard personal/casual leave", isPaid: true, rate: 10, max: 10 },
        { name: "Sick Leave", description: "Medical and health emergencies", isPaid: true, rate: 14, max: 14 },
        { name: "Annual Leave", description: "Earned yearly vacation leave", isPaid: true, rate: 15, max: 15 },
        { name: "Unpaid Leave", description: "Loss of Pay (LOP) approved leave", isPaid: false, rate: 0, max: 30 },
      ];

      for (const t of standardTypes) {
        try {
          const created = await prisma.leaveType.create({
            data: {
              companyId,
              name: t.name,
              description: t.description,
              isPaid: t.isPaid,
              leavePolicies: {
                create: {
                  accrualRate: t.rate,
                  maxBalance: t.max,
                  carryForward: t.name === "Annual Leave",
                  carryForwardLimit: t.name === "Annual Leave" ? 5 : null,
                  approvalLevels: 1
                }
              }
            },
            include: { leavePolicies: true }
          });
          leaveTypes.push(created);
        } catch {
          // Ignore unique collision if another process created it concurrently
        }
      }
    }

    // 7. Onboarding Data Collection Mode (BASIC vs PROFESSIONAL)
    const modeSetting = await prisma.systemSetting.findUnique({
      where: { key: `onboarding_mode_${companyId}` }
    });
    const onboardingMode = modeSetting?.value === "BASIC" ? "BASIC" : "PROFESSIONAL";

    return NextResponse.json({
      success: true,
      data: {
        attendanceConfig,
        companySetting,
        workShifts,
        punishmentSettings,
        allowedNetworks,
        leaveTypes,
        onboardingMode
      }
    });

  } catch (error: any) {
    console.error("Error fetching HR settings:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      shiftStart = "09:00",
      shiftEnd = "18:00",
      gracePeriod = 15,
      fridayOff = true,
      enablePunishmentDeduction = false,
      currency = "BDT",
      timezone = "Asia/Dhaka",
      workingDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      weeklyHolidays = ["Friday", "Saturday"]
    } = body;

    // 1. Synchronize AttendanceConfig
    let attendanceConfig = await prisma.attendanceConfig.findFirst({ where: { companyId } });
    if (!attendanceConfig) {
      attendanceConfig = await prisma.attendanceConfig.create({
        data: {
          companyId,
          shiftStart,
          shiftEnd,
          gracePeriod: Number(gracePeriod) || 0,
          fridayOff: Boolean(fridayOff),
          enablePunishmentDeduction: Boolean(enablePunishmentDeduction)
        }
      });
    } else {
      attendanceConfig = await prisma.attendanceConfig.update({
        where: { id: attendanceConfig.id },
        data: {
          shiftStart,
          shiftEnd,
          gracePeriod: Number(gracePeriod) || 0,
          fridayOff: Boolean(fridayOff),
          enablePunishmentDeduction: Boolean(enablePunishmentDeduction)
        }
      });
    }

    // 2. Synchronize CompanySetting
    let companySetting = await prisma.companySetting.findUnique({ where: { companyId } });
    if (!companySetting) {
      companySetting = await prisma.companySetting.create({
        data: {
          companyId,
          currency,
          timezone,
          shiftStartTime: shiftStart,
          shiftEndTime: shiftEnd,
          gracePeriodMinutes: Number(gracePeriod) || 0,
          workingDays,
          weeklyHolidays
        }
      });
    } else {
      companySetting = await prisma.companySetting.update({
        where: { id: companySetting.id },
        data: {
          currency,
          timezone,
          shiftStartTime: shiftStart,
          shiftEndTime: shiftEnd,
          gracePeriodMinutes: Number(gracePeriod) || 0,
          workingDays,
          weeklyHolidays
        }
      });
    }

    // 3. Synchronize Onboarding Mode (BASIC vs PROFESSIONAL)
    let onboardingMode = body.onboardingMode;
    if (onboardingMode) {
      const mode = onboardingMode === "BASIC" ? "BASIC" : "PROFESSIONAL";
      await prisma.systemSetting.upsert({
        where: { key: `onboarding_mode_${companyId}` },
        update: { value: mode },
        create: {
          key: `onboarding_mode_${companyId}`,
          value: mode,
          description: "Employee data collection mode (BASIC or PROFESSIONAL)"
        }
      });
      onboardingMode = mode;
    }

    return NextResponse.json({
      success: true,
      data: {
        attendanceConfig,
        companySetting,
        onboardingMode
      }
    });

  } catch (error: any) {
    console.error("Error updating HR settings:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
