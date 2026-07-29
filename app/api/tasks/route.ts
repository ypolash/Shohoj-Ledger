import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const tasks = await prisma.task.findMany({
      where: { companyId, systemSource },
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
    const companyId = await getCompanyId();
    const referer = req.headers.get("referer") || "";
    const systemSource = referer.includes("/erp") ? "ERP" : "LEGACY";

    const task = await prisma.task.create({
      data: {
        companyId,
        title,
        description,
        priority: priority || 'Medium',
        status: status || 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToEmployeeId,
        systemSource
      }
    });
    
    return NextResponse.json({ data: task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
