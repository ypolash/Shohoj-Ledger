import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.employeeTask.findMany({
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
    const task = await prisma.employeeTask.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'PENDING'
      }
    });
    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
