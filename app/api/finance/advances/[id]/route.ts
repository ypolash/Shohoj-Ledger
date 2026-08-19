import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    
    // Validate if advance exists
    const existing = await prisma.advance.findUnique({
      where: { id: params.id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    const updated = await prisma.advance.update({
      where: { id: params.id },
      data: {
        memberId: data.memberId,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        reason: data.reason,
        createdAt: data.date ? new Date(data.date) : undefined,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.advance.findUnique({
      where: { id: params.id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    await prisma.advance.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting advance:', error);
    return NextResponse.json({ error: 'Failed to delete advance' }, { status: 500 });
  }
}
