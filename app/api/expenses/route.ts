import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, amount, paymentMethod, description, projectId } = body;

    if (!category || amount === undefined || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expenseAmount = parseFloat(amount);

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: expenseAmount,
        paymentMethod,
        approvalStatus: "PENDING", // Default to pending
        description,
        projectId
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, approvalStatus } = body;

    if (!id || !approvalStatus) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: { approvalStatus }
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense status" }, { status: 500 });
  }
}
