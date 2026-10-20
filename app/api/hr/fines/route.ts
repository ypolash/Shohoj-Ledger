import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { isRegularStaff, isFreelancerOrModel } from "@/lib/staff/staffFilter";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch existing disciplinary fines across ERP and LEGACY sources
    const [existingFines, lateAttendances, punishmentRules] = await Promise.all([
      prisma.employeeFine.findMany({
        where: {
          companyId,
          systemSource: { in: ["ERP", "LEGACY"] }
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              employmentType: true,
              department: true,
              designation: true,
              departmentRef: { select: { name: true } },
              designationRef: { select: { name: true } },
            }
          },
          payrollRun: {
            select: { period: { select: { name: true } } }
          }
        },
        orderBy: { date: "desc" }
      }),
      // Fetch attendance records that have late arrival or fines
      prisma.attendance.findMany({
        where: {
          companyId,
          OR: [
            { punishmentAmount: { gt: 0 } },
            { isLate: true, lateMinutes: { gt: 0 } },
            { reviewStatus: 'CONSIDERED' }
          ]
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              employmentType: true,
              department: true,
              designation: true,
              departmentRef: { select: { name: true } },
              designationRef: { select: { name: true } },
            }
          }
        },
        orderBy: { date: "desc" },
        take: 200
      }),
      // Fetch active late penalty tier rules
      prisma.punishmentSetting.findMany({
        where: {
          active: true,
          type: { in: ['LATE_IN', 'LATE'] },
          OR: [{ companyId }, { companyId: null }]
        },
        orderBy: { fromMinutes: 'asc' }
      })
    ]);

    const finesMap = new Map<string, any>();
    for (const f of existingFines) {
      if (isRegularStaff(f.employee)) {
        finesMap.set(f.id, f);
      }
    }

    // Auto-sync attendance records into EmployeeFine so they display on HR Fines tab
    for (const att of lateAttendances) {
      if (!att.employeeId || !isRegularStaff(att.employee)) continue;

      let fineAmt = 0;
      let isWaived = false;

      if (att.reviewStatus === 'CONSIDERED' || att.reviewStatus === 'WAIVED') {
        fineAmt = Number(att.punishmentAmount || 0);
        if (fineAmt === 0) isWaived = true;
      } else if (att.punishmentAmount !== undefined && att.punishmentAmount !== null && Number(att.punishmentAmount) > 0) {
        fineAmt = Number(att.punishmentAmount);
      } else if (att.isLate && (att.lateMinutes || 0) > 0) {
        const mins = Number(att.lateMinutes) || 0;
        const matchedRule = punishmentRules.find(p => mins >= (p.fromMinutes ?? 0) && mins <= (p.toMinutes ?? 999999));
        if (matchedRule && Number(matchedRule.amount) > 0) {
          fineAmt = Number(matchedRule.amount);
        }
      }

      // If no fine and not waived, skip
      if (fineAmt <= 0 && !isWaived) continue;

      const attDateStr = new Date(att.date).toISOString().slice(0, 10);

      // Check if fine already exists for this attendance day
      const alreadyHasFine = existingFines.find(f => {
        if (f.employeeId !== att.employeeId) return false;
        const fDateStr = new Date(f.date).toISOString().slice(0, 10);
        return fDateStr === attDateStr && (f.reason || '').toLowerCase().includes('late');
      });

      if (!alreadyHasFine) {
        try {
          const fineReason = att.punishmentReason || `Late Arrival Penalty (${att.lateMinutes || 0} min late)`;
          const createdFine = await prisma.employeeFine.create({
            data: {
              companyId,
              employeeId: att.employeeId,
              amount: fineAmt,
              reason: fineReason,
              date: att.date,
              status: isWaived ? "CANCELLED" : "PENDING",
              systemSource: "ERP"
            },
            include: {
              employee: {
                select: {
                  firstName: true,
                  lastName: true,
                  employeeId: true,
                  employmentType: true,
                  department: true,
                  designation: true,
                  departmentRef: { select: { name: true } },
                  designationRef: { select: { name: true } },
                }
              },
              payrollRun: {
                select: { period: { select: { name: true } } }
              }
            }
          });
          finesMap.set(createdFine.id, createdFine);
        } catch (createErr) {
          console.warn("Auto-sync late fine error:", createErr);
        }
      }
    }

    const allFines = Array.from(finesMap.values())
      .filter(f => isRegularStaff(f.employee))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ fines: allFines });
  } catch (error) {
    console.error("GET Fines Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("MANAGE_EMPLOYEES");
    if (rbacGuard) return rbacGuard;

    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const body = await req.json();
    const { employeeId, amount, reason, date } = body;

    if (!employeeId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetEmp = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: { departmentRef: true, designationRef: true }
    });
    if (!targetEmp || !isRegularStaff(targetEmp)) {
      return NextResponse.json({ error: "Disciplinary fines can only be issued to regular staff members." }, { status: 400 });
    }

    const fine = await prisma.employeeFine.create({
      data: {
        companyId,
        employeeId,
        amount: Number(amount),
        reason,
        date: date ? new Date(date) : new Date(),
        status: "PENDING",
        systemSource
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true, userId: true }
        }
      }
    });

    // Create in-app Notification record if employee has linked user account
    if (fine.employee?.userId) {
      try {
        await prisma.notification.create({
          data: {
            companyId,
            userId: fine.employee.userId,
            category: "FINE",
            title: `Disciplinary Fine: ৳${Number(amount)}`,
            message: `A penalty fine of ৳${Number(amount)} has been imposed: ${reason}`,
            channel: "IN_APP",
            status: "UNREAD",
            priority: "HIGH",
          }
        });
      } catch (notifErr) {
        console.warn("Failed to create in-app notification record:", notifErr);
      }
    }

    // Sync with active payroll so new fine immediately deducts from net salary
    const targetDate = date ? new Date(date) : new Date();
    const activePayment = await prisma.salaryPayment.findFirst({
      where: {
        companyId: companyId!,
        employeeId,
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        status: { in: ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'] }
      }
    });

    if (activePayment) {
      const newNet = Math.max(0, Number(activePayment.netSalary) - Number(amount));
      await prisma.salaryPayment.update({
        where: { id: activePayment.id },
        data: { netSalary: newNet }
      });
    }

    return NextResponse.json({ fine });
  } catch (error) {
    console.error("POST Fine Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
