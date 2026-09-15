import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    let employee = await resolveEssEmployee(req);

    if (!employee) {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get("employeeId");
      if (employeeId) {
        employee = await prisma.employee.findFirst({
          where: {
            OR: [
              { employeeId },
              { id: employeeId },
            ],
          },
        });
      }
    }

    if (!employee) {
      return NextResponse.json(
        { error: "Unauthorized or employee not found" },
        { status: 401, headers: ESS_CORS_HEADERS }
      );
    }

    const { companyId, departmentId } = employee;
    const whereClause: any = {
      status: "ACTIVE",
      OR: [
        { targetType: "ALL" },
        ...(departmentId ? [{ targetType: "DEPARTMENT", targetId: departmentId }] : []),
      ],
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const mapped = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.message,
      message: a.message,
      type: a.priority === "URGENT" ? "URGENT" : (a.priority === "IMPORTANT" ? "IMPORTANT" : "INFO"),
      author: "HR Department",
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({ announcements: mapped }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("[Mobile Announcements GET Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
