import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/calculations";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || "");
    const year = parseInt(url.searchParams.get("year") || "");

    if (isNaN(month) || isNaN(year)) {
      // Just fetch all settlements
      const settlements = await prisma.settlement.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(settlements);
    }

    // PREVIEW CALCULATION for a specific month/year
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const incomes = await prisma.income.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: { in: ["PAID", "PARTIAL"] },
        shareable: true
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        approvalStatus: "APPROVED"
      }
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.received), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const netProfit = totalIncome - totalExpenses;

    // Distribution logic by category
    const projectIncomes: Record<string, { total: number; category: string }> = {};
    const nonProjectIncomes: Array<{ amount: number; category: string }> = [];

    incomes.forEach(inc => {
      if (inc.projectId) {
        if (!projectIncomes[inc.projectId]) {
          projectIncomes[inc.projectId] = { total: 0, category: inc.category };
        }
        projectIncomes[inc.projectId].total += Number(inc.received);
      } else {
        nonProjectIncomes.push({ amount: Number(inc.received), category: inc.category });
      }
    });

    const projectExpenses: Record<string, number> = {};
    let generalExpense = 0;

    expenses.forEach(exp => {
      if (exp.projectId) {
        projectExpenses[exp.projectId] = (projectExpenses[exp.projectId] || 0) + Number(exp.amount);
      } else {
        generalExpense += Number(exp.amount);
      }
    });

    let ceoShare = 0;
    let developerShare = 0;
    let advisorShare = 0;
    let companyShare = 0;

    // 1. Calculate shares from project-specific income minus project-specific expenses
    Object.keys(projectIncomes).forEach(projectId => {
      const pIncome = projectIncomes[projectId].total;
      const pExpense = projectExpenses[projectId] || 0;
      const pNet = pIncome - pExpense;
      
      if (pNet > 0) {
        const shares = calculateSettlement(pNet, projectIncomes[projectId].category);
        ceoShare += shares.ceo;
        developerShare += shares.developer;
        advisorShare += shares.advisor;
        companyShare += shares.company;
      }
    });

    // 2. Add non-project income shares (using their explicit category)
    nonProjectIncomes.forEach(inc => {
      if (inc.amount > 0) {
        const shares = calculateSettlement(inc.amount, inc.category);
        ceoShare += shares.ceo;
        developerShare += shares.developer;
        advisorShare += shares.advisor;
        companyShare += shares.company;
      }
    });

    // 3. Deduct general expenses proportionally from everyone's gross shares
    if (generalExpense > 0) {
      const grossShares = ceoShare + developerShare + advisorShare + companyShare;
      if (grossShares > 0) {
        ceoShare = Math.max(0, ceoShare - generalExpense * (ceoShare / grossShares));
        developerShare = Math.max(0, developerShare - generalExpense * (developerShare / grossShares));
        advisorShare = Math.max(0, advisorShare - generalExpense * (advisorShare / grossShares));
        companyShare = Math.max(0, companyShare - generalExpense * (companyShare / grossShares));
      } else {
        // If there's no income but there are general expenses, it hits the company reserve
        companyShare -= generalExpense;
      }
    }

    return NextResponse.json({
      period: `${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
      totalIncome,
      totalExpenses,
      netProfit,
      ceoShare,
      developerShare,
      advisorShare,
      companyShare
    });
  } catch (error) {
    console.error("Error with settlements GET:", error);
    return NextResponse.json({ error: "Failed to process settlement request" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, totalIncome, totalExpenses, ceoShare, developerShare, advisorShare, companyShare } = body;

    const settlement = await prisma.settlement.create({
      data: {
        period,
        totalIncome,
        totalExpenses,
        ceoShare,
        developerShare,
        advisorShare,
        companyShare,
        status: "PENDING"
      }
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Error creating settlement:", error);
    return NextResponse.json({ error: "Failed to record settlement" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== "EXECUTE") {
      return NextResponse.json({ error: "Invalid execution request" }, { status: 400 });
    }

    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement || settlement.status !== "PENDING") {
      return NextResponse.json({ error: "Settlement not found or already executed" }, { status: 400 });
    }

    // Execute the settlement within a transaction
    const [updatedSettlement, reserveDeposit] = await prisma.$transaction([
      // 1. Mark Settlement as Executed
      prisma.settlement.update({
        where: { id },
        data: { status: "EXECUTED" }
      }),
      // 2. Auto-transfer the Company portion to the Reserve Balance
      prisma.reserveTransaction.create({
        data: {
          type: "DEPOSIT",
          amount: settlement.companyShare,
          reason: `Auto-deposit from ${settlement.period} Settlement`,
          // Note: The current Prisma schema for ReserveTransaction might not have settlementId explicitly linked,
          // but we can add it to the reason/description.
        }
      })
    ]);

    return NextResponse.json(updatedSettlement);
  } catch (error) {
    console.error("Error executing settlement:", error);
    return NextResponse.json({ error: "Failed to execute settlement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Settlement ID is required" }, { status: 400 });
    }

    const settlement = await prisma.settlement.findUnique({ where: { id } });
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    // Use a transaction to delete the settlement and its auto-deposit
    await prisma.$transaction([
      prisma.reserveTransaction.deleteMany({
        where: {
          reason: { contains: settlement.period }
        }
      }),
      prisma.settlement.delete({
        where: { id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting settlement:", error);
    return NextResponse.json({ error: "Failed to delete settlement" }, { status: 500 });
  }
}
