import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const serviceType = searchParams.get("serviceType");

    const where: any = {};
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      phone,
      email,
      serviceType,
      expectedValue,
      leadSource,
      assignedTo,
      nextFollowUp,
      notes,
    } = body;

    const newLead = await prisma.lead.create({
      data: {
        companyName,
        contactPerson,
        phone,
        email,
        serviceType,
        expectedValue,
        leadSource,
        assignedTo,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        notes,
        status: "New"
      }
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
