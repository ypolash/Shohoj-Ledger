import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const activities = await prisma.customerActivity.findMany({
      where: { companyId, customerId: params.id },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
    
    const params = await props.params;

    const activity = await prisma.customerActivity.create({
      data: {
        companyId,
        customerId: params.id,
        performedById: userId,
        type: data.type || "TASK",
        title: data.title,
        date: data.date ? new Date(data.date) : new Date(),
        status: data.status || "UPCOMING",
        notes: data.notes || null,
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
