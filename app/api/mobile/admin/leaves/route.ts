import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAdmin, CORS_HEADERS } from "@/lib/auth/mobileAdminGuard";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const guard = await verifyMobileAdmin();
  if (!guard.authorized) return guard.response;

  const { companyId } = guard;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim() || "";
    const search = url.searchParams.get("search")?.trim() || "";

    const where: any = { companyId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
          },
        },
      },
    });

    const formattedLeaves = leaves
      .map((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return {
          id: l.id,
          employeeDbId: l.employee?.id || "",
          employeeId: l.employee?.employeeId || "EMP-N/A",
          employeeName: l.employee
            ? `${l.employee.firstName} ${l.employee.lastName}`.trim()
            : "Employee",
          designation: l.employee?.designation || "Staff",
          department: l.employee?.department || "General",
          type: l.type,
          startDate: l.startDate.toISOString().split("T")[0],
          endDate: l.endDate.toISOString().split("T")[0],
          durationDays,
          reason: l.reason,
          status: l.status,
          appliedAt: l.createdAt.toISOString(),
        };
      })
      .filter((l) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          l.employeeName.toLowerCase().includes(s) ||
          l.employeeId.toLowerCase().includes(s) ||
          l.type.toLowerCase().includes(s) ||
          l.reason.toLowerCase().includes(s)
        );
      });

    // Compute status counts
    const allCompanyLeaves = await prisma.leaveRequest.findMany({
      where: { companyId },
      select: { status: true },
    });

    const statusCounts = {
      ALL: allCompanyLeaves.length,
      PENDING: allCompanyLeaves.filter((l) => l.status === "PENDING").length,
      APPROVED: allCompanyLeaves.filter((l) => l.status === "APPROVED").length,
      REJECTED: allCompanyLeaves.filter((l) => l.status === "REJECTED").length,
    };

    return NextResponse.json(
      {
        success: true,
        counts: statusCounts,
        leaves: formattedLeaves,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Mobile Admin Leaves] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave requests." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
