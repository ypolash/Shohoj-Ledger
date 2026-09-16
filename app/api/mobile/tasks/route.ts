import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

function normalizeChecklist(raw: any) {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (Array.isArray(parsed)) {
    return { type: "CHECKLIST", items: parsed };
  }
  if (parsed && typeof parsed === "object") {
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return { ...parsed, type: parsed.type || "CHECKLIST", items };
  }
  return null;
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

    const mapped = tasks.map(t => ({
      ...t,
      checklist: normalizeChecklist(t.checklist)
    }));

    return NextResponse.json(mapped, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Tasks GET Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
