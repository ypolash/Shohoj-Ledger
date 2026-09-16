import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

/**
 * OPTIONS /api/ess/tasks
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ESS_CORS_HEADERS });
}

/**
 * GET /api/ess/tasks
 * Returns tasks assigned strictly to the authenticated employee.
 */
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

export async function GET(request: Request) {
  try {
    const employee = await resolveEssEmployee(request);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: ESS_CORS_HEADERS });
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedToEmployeeId: employee.employeeId,
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = tasks.map(t => ({
      ...t,
      checklist: normalizeChecklist(t.checklist)
    }));

    return NextResponse.json({ tasks: mapped }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Tasks fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
