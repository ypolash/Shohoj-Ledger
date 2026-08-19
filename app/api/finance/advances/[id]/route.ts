import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
