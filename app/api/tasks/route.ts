import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json({ data: tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const { title, description, priority, status, dueDate, assignedToEmployeeId } = data;
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToEmployeeId
      }
    });
    
    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
