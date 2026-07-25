import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const ownershipGuard = await verifyOwnership("task", params.id);
    if (ownershipGuard) return ownershipGuard;

    const data = await req.json();
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: data.status !== undefined ? data.status : undefined,
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined
      }
    });
    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const ownershipGuard = await verifyOwnership("task", params.id);
    if (ownershipGuard) return ownershipGuard;

    await prisma.task.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
