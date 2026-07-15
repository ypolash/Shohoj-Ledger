import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, nextFollowUp, notes, lostReason, assignedTo } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (nextFollowUp !== undefined) data.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
    if (notes !== undefined) data.notes = notes;
    if (lostReason !== undefined) data.lostReason = lostReason;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data
    });

    return NextResponse.json({ success: true, data: updatedLead });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.lead.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
