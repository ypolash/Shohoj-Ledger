import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const advances = await prisma.advance.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const userIds = advances.map(a => a.memberId);
    const members = await prisma.member.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = members.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    const advancesWithDetails = advances.map(adv => ({
      ...adv,
      memberName: userMap[adv.memberId] || "Unknown Member"
    }));

    return NextResponse.json(advancesWithDetails);
  } catch (error) {
    console.error("Error fetching advances:", error);
    return NextResponse.json({ error: "Failed to fetch advances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, amount, description } = body;

    if (!memberId || amount === undefined) {
      return NextResponse.json({ error: "Missing memberId or amount" }, { status: 400 });
    }

    const advanceAmount = parseFloat(amount);

    const advance = await prisma.advance.create({
      data: {
        memberId,
        amount: advanceAmount,
        remainingAmount: advanceAmount,
        status: "ACTIVE",
        reason: description,
      }
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error("Error creating advance:", error);
    return NextResponse.json({ error: "Failed to issue advance" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updatedAdvance = await prisma.advance.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updatedAdvance);
  } catch (error) {
    console.error("Error updating advance status:", error);
    return NextResponse.json({ error: "Failed to update advance status" }, { status: 500 });
  }
}
