import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const loans = await prisma.memberLoan.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // We also need the user names
    const userIds = loans.map(l => l.memberId);
    const members = await prisma.member.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = members.reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {} as Record<string, string>);

    const now = new Date();

    const loansWithDetails = loans.map(loan => {
      const issueDate = new Date(loan.issueDate);
      const dueDate = new Date(issueDate);
      dueDate.setMonth(dueDate.getMonth() + 6);
      
      const isOverdue = loan.status === "ACTIVE" && now > dueDate;

      return {
        ...loan,
        memberName: userMap[loan.memberId] || "Unknown Member",
        dueDate: dueDate.toISOString(),
        isOverdue
      };
    });

    return NextResponse.json(loansWithDetails);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, amount, description } = body;

    if (!memberId || amount === undefined) {
      return NextResponse.json({ error: "Missing memberId or amount" }, { status: 400 });
    }

    const loanAmount = parseFloat(amount);

    const loan = await prisma.memberLoan.create({
      data: {
        memberId,
        amount: loanAmount,
        remainingAmount: loanAmount,
        status: "ACTIVE",
        reason: description,
        issueDate: new Date()
      }
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to issue loan" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updateData: any = { status };
    
    // If marking as repaid, set repayment date
    if (status === "REPAID" || status === "DEDUCTED") {
      updateData.repaymentDate = new Date();
    }

    const updatedLoan = await prisma.memberLoan.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error("Error updating loan status:", error);
    return NextResponse.json({ error: "Failed to update loan status" }, { status: 500 });
  }
}
