import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedSetting = await prisma.punishmentSetting.update({
      where: { id },
      data: {
        type: body.type,
        fromMinutes: body.fromMinutes !== undefined ? Number(body.fromMinutes) : undefined,
        toMinutes: body.toMinutes !== undefined ? Number(body.toMinutes) : undefined,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        active: body.active
      }
    });
    
    return NextResponse.json(updatedSetting);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.punishmentSetting.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
