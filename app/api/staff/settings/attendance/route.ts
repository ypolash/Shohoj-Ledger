import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.attendanceConfig.findFirst();
    if (!config) {
      config = await prisma.attendanceConfig.create({ data: {} });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let config = await prisma.attendanceConfig.findFirst();
    
    if (!config) {
      config = await prisma.attendanceConfig.create({ data: body });
    } else {
      config = await prisma.attendanceConfig.update({
        where: { id: config.id },
        data: {
          gracePeriod: body.gracePeriod,
          shiftStart: body.shiftStart,
          shiftEnd: body.shiftEnd,
          fridayOff: body.fridayOff,
          enablePunishmentDeduction: body.enablePunishmentDeduction
        }
      });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
