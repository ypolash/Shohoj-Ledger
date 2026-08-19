import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validate if advance exists
    const existing = await prisma.advance.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    const oldAmount = parseFloat(existing.amount.toString());
    const oldRemaining = parseFloat(existing.remainingAmount.toString());
    const recoveredAmount = oldAmount - oldRemaining;
    const newAmount = data.amount ? parseFloat(data.amount) : oldAmount;
    const newRemainingAmount = newAmount - recoveredAmount;

    if (newRemainingAmount < 0) {
      return NextResponse.json({ error: 'New amount cannot be less than the amount already recovered' }, { status: 400 });
    }

    const updated = await prisma.advance.update({
      where: { id },
      data: {
        memberId: data.memberId,
        amount: newAmount,
        remainingAmount: newRemainingAmount,
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.advance.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
    }

    await prisma.advance.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting advance:', error);
    return NextResponse.json({ error: 'Failed to delete advance' }, { status: 500 });
  }
}
