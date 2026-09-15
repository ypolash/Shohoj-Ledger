import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawEmployeeId = searchParams.get("employeeId");

    if (!rawEmployeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400, headers: ESS_CORS_HEADERS }
      );
    }

    // Resolve exact employeeId string (whether employeeId or uuid was passed)
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: rawEmployeeId },
          { id: rawEmployeeId },
        ],
      },
      select: { employeeId: true },
    });

    const targetEmployeeId = emp ? emp.employeeId : rawEmployeeId;

    const tasks = await prisma.task.findMany({
      where: {
        assignedToEmployeeId: targetEmployeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Tasks GET Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
