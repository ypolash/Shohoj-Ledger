import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEssEmployee, ESS_CORS_HEADERS } from "@/lib/auth/resolveEmployeeSession";

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
    const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.todos) ? parsed.todos : []);
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

    const regularTasks = await prisma.task.findMany({
      where: {
        assignedToEmployeeId: employee.employeeId,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedRegular = regularTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status || "Pending",
      priority: t.priority || "Medium",
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      assignedToEmployeeId: t.assignedToEmployeeId,
      createdAt: t.createdAt.toISOString(),
      checklist: normalizeChecklist(t.checklist),
      isSpecialTask: false,
      points: 0,
      rewardAmount: 0,
      submissionStatus: null,
    }));

    // Special tasks
    const specialTasks = await (prisma as any).taskReward.findMany({
      where: {
        companyId: employee.companyId,
        status: { in: ["OPEN", "IN_PROGRESS", "COMPLETED"] },
        OR: [
          { assignedToEmployeeId: null },
          { assignedToEmployeeId: employee.id },
          { assignedToEmployeeId: employee.employeeId },
        ],
      },
      include: {
        submissions: {
          where: { employeeId: employee.id },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const setting = await (prisma as any).taskRewardSetting.findUnique({
      where: { companyId: employee.companyId },
    });
    const pointRate = setting ? Number(setting.pointToCashRate) : 10;

    const mappedSpecial = (specialTasks || []).map((st: any) => {
      const mySub = st.submissions && st.submissions.length > 0 ? st.submissions[0] : null;
      let mappedStatus = "Pending";
      if (mySub) {
        if (mySub.status === "APPROVED") mappedStatus = "Completed";
        else if (mySub.status === "PENDING") mappedStatus = "In Progress";
        else mappedStatus = "Blocked";
      } else if (st.status === "COMPLETED") {
        mappedStatus = "Completed";
      }

      const cashValue = st.monetaryValue ? Number(st.monetaryValue) : st.points * pointRate;

      return {
        id: st.id,
        title: st.title,
        description: st.description,
        status: mappedStatus,
        priority: st.priority || "High",
        dueDate: st.deadline ? st.deadline.toISOString() : null,
        assignedToEmployeeId: st.assignedToEmployeeId || employee.employeeId,
        createdAt: st.createdAt.toISOString(),
        checklist: normalizeChecklist(st.checklist),
        isSpecialTask: true,
        points: st.points,
        rewardAmount: cashValue,
        category: st.category,
        submissionStatus: mySub ? mySub.status : null,
        maxClaims: st.maxClaims,
      };
    });

    return NextResponse.json({ tasks: [...mappedSpecial, ...mappedRegular] }, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[ESS] Tasks fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
