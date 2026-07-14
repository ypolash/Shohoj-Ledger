import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const incomes = await prisma.income.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, source, amount, received, shareable, description, projectId } = body;

    if (!category || amount === undefined || received === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalAmount = parseFloat(amount);
    const receivedAmount = parseFloat(received);

    let paymentStatus = "UNPAID";
    if (receivedAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (receivedAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    const income = await prisma.income.create({
      data: {
        category,
        source,
        amount: totalAmount,
        received: receivedAmount,
        paymentStatus,
        shareable: shareable ?? true,
        description,
        projectId
      }
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json({ error: "Failed to record income" }, { status: 500 });
  }
}
