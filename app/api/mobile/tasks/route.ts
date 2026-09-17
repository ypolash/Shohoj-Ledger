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
    const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.todos) ? parsed.todos : []);
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

    // Resolve exact employeeId string and db id
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeId: rawEmployeeId },
          { id: rawEmployeeId },
        ],
      },
      select: { id: true, employeeId: true, companyId: true, department: true },
    });

    const targetEmployeeId = emp ? emp.employeeId : rawEmployeeId;
    const empDbId = emp ? emp.id : rawEmployeeId;
    const companyId = emp ? emp.companyId : null;

    // 1. Fetch Regular Tasks
    const regularTasks = await prisma.task.findMany({
      where: {
        assignedToEmployeeId: targetEmployeeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedRegular = regularTasks.map(t => ({
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

    // 2. Fetch Special Reward Tasks if companyId is resolved
    let mappedSpecial: any[] = [];
    if (companyId) {
      const specialTasks = await prisma.taskReward.findMany({
        where: {
          companyId,
          status: { in: ["OPEN", "IN_PROGRESS", "COMPLETED"] },
          OR: [
            { assignedToEmployeeId: null },
            { assignedToEmployeeId: empDbId },
            { assignedToEmployeeId: targetEmployeeId },
          ],
        },
        include: {
          submissions: {
            where: { employeeId: empDbId },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const setting = await prisma.taskRewardSetting.findUnique({
        where: { companyId },
      });
      const pointRate = setting ? Number(setting.pointToCashRate) : 10;

      mappedSpecial = specialTasks.map(st => {
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
          assignedToEmployeeId: st.assignedToEmployeeId || targetEmployeeId,
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
    }

    // Combine: Special tasks first, then regular tasks
    const allTasks = [...mappedSpecial, ...mappedRegular];

    return NextResponse.json(allTasks, { headers: ESS_CORS_HEADERS });
  } catch (error) {
    console.error("[Mobile Tasks GET Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
