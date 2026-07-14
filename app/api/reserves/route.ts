import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.reserveTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Calculate total reserve balance
    const totalReserve = transactions.reduce((acc, curr) => {
      const amt = Number(curr.amount);
      return curr.type === "DEPOSIT" ? acc + amt : acc - amt;
    }, 0);

    return NextResponse.json({
      transactions,
      totalReserve
    });
  } catch (error) {
    console.error("Error fetching reserve transactions:", error);
    return NextResponse.json({ error: "Failed to fetch reserve data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, type, description } = body;

    if (amount === undefined || !type) {
      return NextResponse.json({ error: "Missing amount or type" }, { status: 400 });
    }

    const transactionAmount = parseFloat(amount);

    const transaction = await prisma.reserveTransaction.create({
      data: {
        amount: transactionAmount,
        type, // "DEPOSIT" or "WITHDRAWAL"
        description
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating reserve transaction:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
