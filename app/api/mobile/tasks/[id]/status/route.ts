import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOwnership } from "@/lib/company/verifyOwnership";
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

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {

    const params = await props.params;

    const ownershipGuard = await verifyOwnership("task", params.id);
    if (ownershipGuard) return ownershipGuard;
    
    if (!params.id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, checklist } = body;

    const validStatuses = ["Pending", "In Progress", "Completed", "Blocked"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    if (!status && checklist === undefined) {
      return NextResponse.json(
        { error: "Either status or checklist is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (checklist !== undefined) updateData.checklist = checklist;

    const updatedTask = await prisma.task.update({
      where: { ...(await withCompany()), id: params.id },
      data: updateData,
    });

    // If this task is tied to a CRM lead, log activity on the lead timeline
    try {
      const checklist = updatedTask.checklist as any;
      let leadId = checklist?.leadId;
      if (!leadId && updatedTask.description) {
        const match = updatedTask.description.match(/\[CRM-LEAD:([^\]]+)\]/);
        if (match) leadId = match[1];
      }

      if (leadId) {
        await prisma.leadActivity.create({
          data: {
            companyId: updatedTask.companyId,
            leadId,
            type: "TASK_STATUS_UPDATE",
            description: `Staff updated assigned task status to "${status}" via Mobile App`,
            newValue: status,
          }
        });
      }
    } catch (actErr) {
      console.error("Failed to log mobile task update to lead activity:", actErr);
    }

    return NextResponse.json({
      ...updatedTask,
      checklist: normalizeChecklist(updatedTask.checklist),
    }, { headers: ESS_CORS_HEADERS });
  } catch (error: any) {
    console.error("Error updating task status:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404, headers: ESS_CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: ESS_CORS_HEADERS }
    );
  }
}
