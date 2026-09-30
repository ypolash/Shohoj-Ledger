import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId, withCompany } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { requireModule } from "@/lib/modules/moduleGuard";

import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  try {
    let companyId: string | null = null;
    try {
      companyId = await getCompanyId();
    } catch {
      const session = await getSession();
      companyId = session?.user?.companyId || null;
      if (!companyId) {
        const firstCompany = await prisma.company.findFirst({ select: { id: true } });
        companyId = firstCompany?.id || null;
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: "No active company profile found." }, { status: 400 });
    }

    const session = await getSession();
    // Allow authorized ERP users or admin sessions
    if (session?.user && session.user.platformRole !== "SUPER_ADMIN") {
      const userRole = (session.user.role || "").toLowerCase();
      const isAdmin = ["owner", "admin", "ceo", "accountant", "hr", "manager"].some(r => userRole.includes(r));
      if (!isAdmin && session.user.role) {
        try {
          const rbacGuard = await requirePermission("FINANCE_VIEW");
          if (rbacGuard) return rbacGuard;
        } catch (rErr) {
          console.warn("RBAC check exception:", rErr);
        }
      }
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "monthly"; // "weekly" | "monthly" | "yearly" | "custom"
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month"); // 1-12
    const weekOffsetParam = url.searchParams.get("weekOffset"); // 0 for current, -1 for last week, etc.

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel = "";

    if (period === "weekly") {
      const offset = parseInt(weekOffsetParam || "0", 10);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + offset * 7);

      // Start of week (Monday)
      const day = targetDate.getDay();
      const diffToMon = targetDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(targetDate);
      startDate.setDate(diffToMon);
      startDate.setHours(0, 0, 0, 0);

      // End of week (Sunday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      periodLabel = `Week of ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else if (period === "monthly") {
      const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
      const month = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth(); // 0-indexed

      startDate = new Date(year, month, 1, 0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

      periodLabel = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (period === "yearly") {
      const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      periodLabel = `Fiscal Year ${year}`;
    } else {
      // Custom date range
      if (startDateParam) {
        startDate = new Date(startDateParam);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }

      if (endDateParam) {
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      }

      periodLabel = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }

    const companyWhere = { companyId };

    // Fetch Company Profile
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true, businessType: true }
    });

    // 1. Fetch Income records
    const incomes = await prisma.income.findMany({
      where: {
        ...companyWhere,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch Expense records
    const expenses = await prisma.expense.findMany({
      where: {
        ...companyWhere,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: "desc" }
    });

    // 3. Fetch Salary / Payroll Payments
    const payrolls = await prisma.salaryPayment.findMany({
      where: {
        ...companyWhere,
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 4. Fetch Advances
    const advances = await prisma.advance.findMany({
      where: {
        ...companyWhere,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: "desc" }
    });

    // 5. Fetch Settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        ...companyWhere,
        createdAt: { gte: startDate, lte: endDate }
      },
      orderBy: { createdAt: "desc" }
    });

    // 6. Fetch Ledger entries for cash & bank tracking
    const ledgers = await prisma.ledgerEntry.findMany({
      where: {
        companyId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: "asc" }
    });

    // ==========================================
    // AGGREGATIONS & CALCULATIONS
    // ==========================================
    let totalIncome = 0;
    let totalIncomeReceived = 0;
    let accountsReceivable = 0;

    const incomeCategoryMap: Record<string, { total: number; count: number }> = {};

    incomes.forEach((inc) => {
      const amt = Number(inc.amount) || 0;
      const rec = Number(inc.received) || (inc.paymentStatus === "PAID" ? amt : 0);
      totalIncome += amt;
      totalIncomeReceived += rec;
      accountsReceivable += Math.max(0, amt - rec);

      const cat = inc.category || "General Income";
      if (!incomeCategoryMap[cat]) incomeCategoryMap[cat] = { total: 0, count: 0 };
      incomeCategoryMap[cat].total += amt;
      incomeCategoryMap[cat].count += 1;
    });

    let totalDirectExpense = 0;
    const expenseCategoryMap: Record<string, { total: number; count: number }> = {};
    const paymentMethodMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      totalDirectExpense += amt;

      const cat = exp.category || "General Expense";
      if (!expenseCategoryMap[cat]) expenseCategoryMap[cat] = { total: 0, count: 0 };
      expenseCategoryMap[cat].total += amt;
      expenseCategoryMap[cat].count += 1;

      const method = exp.paymentMethod || "Bank Transfer";
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + amt;
    });

    let totalPayroll = 0;
    payrolls.forEach((pay) => {
      const amt = Number(pay.netSalary) || 0;
      totalPayroll += amt;

      if (!expenseCategoryMap["Payroll & Staff Salaries"]) {
        expenseCategoryMap["Payroll & Staff Salaries"] = { total: 0, count: 0 };
      }
      expenseCategoryMap["Payroll & Staff Salaries"].total += amt;
      expenseCategoryMap["Payroll & Staff Salaries"].count += 1;

      const method = pay.paymentMethod || "Bank Transfer";
      paymentMethodMap[method] = (paymentMethodMap[method] || 0) + amt;
    });

    let totalAdvancesIssued = 0;
    advances.forEach((adv) => {
      const amt = Number(adv.amount) || 0;
      totalAdvancesIssued += amt;
    });

    let totalSettlements = 0;
    settlements.forEach((stl) => {
      const ceo = Number(stl.ceoShare) || 0;
      const dev = Number(stl.developerShare) || 0;
      const adv = Number(stl.advisorShare) || 0;
      const sum = ceo + dev + adv;
      totalSettlements += sum;

      if (sum > 0) {
        if (!expenseCategoryMap["Talent & Partner Settlements"]) {
          expenseCategoryMap["Talent & Partner Settlements"] = { total: 0, count: 0 };
        }
        expenseCategoryMap["Talent & Partner Settlements"].total += sum;
        expenseCategoryMap["Talent & Partner Settlements"].count += 1;
      }
    });

    const totalAllExpenses = totalDirectExpense + totalPayroll + totalSettlements;
    const netProfit = totalIncome - totalAllExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : "0.0";

    // Cash flow from ledgers / cash receipts
    let totalCashIn = 0;
    let totalCashOut = 0;

    ledgers.forEach((l) => {
      const debit = Number(l.debit) || 0;
      const credit = Number(l.credit) || 0;
      const acc = (l.accountType || "").toUpperCase();

      if (acc.includes("CASH") || acc.includes("BANK")) {
        totalCashIn += debit;
        totalCashOut += credit;
      }
    });

    // Fallback if ledger entries not initialized
    if (totalCashIn === 0 && totalIncomeReceived > 0) {
      totalCashIn = totalIncomeReceived;
    }
    if (totalCashOut === 0 && totalAllExpenses > 0) {
      totalCashOut = totalAllExpenses;
    }

    const netCashFlow = totalCashIn - totalCashOut;

    // Income breakdown sorted by amount
    const incomeByCategory = Object.entries(incomeCategoryMap)
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percentage: totalIncome > 0 ? ((total / totalIncome) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.total - a.total);

    // Expense breakdown sorted by amount
    const expensesByCategory = Object.entries(expenseCategoryMap)
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percentage: totalAllExpenses > 0 ? ((total / totalAllExpenses) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.total - a.total);

    // Payment methods breakdown
    const paymentMethodsBreakdown = Object.entries(paymentMethodMap).map(([method, total]) => ({
      method,
      total,
      percentage: totalAllExpenses > 0 ? ((total / totalAllExpenses) * 100).toFixed(1) : "0.0"
    }));

    // ==========================================
    // TIMELINE TREND AGGREGATION
    // ==========================================
    const isYearlyOrLong = (endDate.getTime() - startDate.getTime()) > (35 * 24 * 60 * 60 * 1000);
    const timelineMap: Record<string, { label: string; date: string; income: number; expense: number; profit: number }> = {};

    if (!isYearlyOrLong) {
      // Group by Day
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const key = cur.toISOString().split("T")[0];
        const label = cur.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        timelineMap[key] = { label, date: key, income: 0, expense: 0, profit: 0 };
        cur.setDate(cur.getDate() + 1);
      }

      incomes.forEach(inc => {
        const k = inc.createdAt.toISOString().split("T")[0];
        if (timelineMap[k]) timelineMap[k].income += Number(inc.amount) || 0;
      });

      expenses.forEach(exp => {
        const k = exp.createdAt.toISOString().split("T")[0];
        if (timelineMap[k]) timelineMap[k].expense += Number(exp.amount) || 0;
      });

      payrolls.forEach(pay => {
        const k = pay.createdAt.toISOString().split("T")[0];
        if (timelineMap[k]) timelineMap[k].expense += Number(pay.netSalary) || 0;
      });
    } else {
      // Group by Month
      const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (cur <= endDate) {
        const key = `${cur.getFullYear()}-${(cur.getMonth() + 1).toString().padStart(2, "0")}`;
        const label = cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        timelineMap[key] = { label, date: key, income: 0, expense: 0, profit: 0 };
        cur.setMonth(cur.getMonth() + 1);
      }

      incomes.forEach(inc => {
        const k = `${inc.createdAt.getFullYear()}-${(inc.createdAt.getMonth() + 1).toString().padStart(2, "0")}`;
        if (timelineMap[k]) timelineMap[k].income += Number(inc.amount) || 0;
      });

      expenses.forEach(exp => {
        const k = `${exp.createdAt.getFullYear()}-${(exp.createdAt.getMonth() + 1).toString().padStart(2, "0")}`;
        if (timelineMap[k]) timelineMap[k].expense += Number(exp.amount) || 0;
      });

      payrolls.forEach(pay => {
        const k = `${pay.createdAt.getFullYear()}-${(pay.createdAt.getMonth() + 1).toString().padStart(2, "0")}`;
        if (timelineMap[k]) timelineMap[k].expense += Number(pay.netSalary) || 0;
      });
    }

    const timelineTrend = Object.values(timelineMap).map(t => ({
      ...t,
      profit: t.income - t.expense
    }));

    // ==========================================
    // ITEMIZED TRANSACTIONS LIST
    // ==========================================
    const transactions: Array<{
      id: string;
      date: string;
      type: "INCOME" | "EXPENSE" | "PAYROLL" | "ADVANCE" | "SETTLEMENT";
      category: string;
      description: string;
      paymentMethod: string;
      amount: number;
      status: string;
      reference?: string;
    }> = [];

    incomes.forEach((inc) => {
      transactions.push({
        id: inc.id,
        date: inc.createdAt.toISOString(),
        type: "INCOME",
        category: inc.category || "Income",
        description: inc.description || inc.source || "Client Payment",
        paymentMethod: inc.paymentStatus === "PAID" ? "Settled" : "Invoice",
        amount: Number(inc.amount) || 0,
        status: inc.paymentStatus || "COMPLETED",
        reference: inc.projectId ? `Project #${inc.projectId.slice(0, 8)}` : undefined
      });
    });

    expenses.forEach((exp) => {
      transactions.push({
        id: exp.id,
        date: exp.createdAt.toISOString(),
        type: "EXPENSE",
        category: exp.category || "Expense",
        description: exp.description || "Operational Outflow",
        paymentMethod: exp.paymentMethod || "Bank Transfer",
        amount: Number(exp.amount) || 0,
        status: exp.approvalStatus || "APPROVED",
        reference: exp.projectId ? `Project #${exp.projectId.slice(0, 8)}` : undefined
      });
    });

    payrolls.forEach((pay) => {
      const empName = pay.employee ? `${pay.employee.firstName} ${pay.employee.lastName}` : "Employee";
      transactions.push({
        id: pay.id,
        date: pay.createdAt.toISOString(),
        type: "PAYROLL",
        category: "Staff Payroll",
        description: `Salary: ${empName} (${pay.month}/${pay.year})`,
        paymentMethod: pay.paymentMethod || "Bank Transfer",
        amount: Number(pay.netSalary) || 0,
        status: pay.status || "PAID",
        reference: pay.employee?.employeeId
      });
    });

    advances.forEach((adv) => {
      transactions.push({
        id: adv.id,
        date: adv.createdAt.toISOString(),
        type: "ADVANCE",
        category: "Member / Staff Advance",
        description: adv.reason || "Advance Disbursement",
        paymentMethod: "Advance",
        amount: Number(adv.amount) || 0,
        status: adv.status || "ACTIVE"
      });
    });

    settlements.forEach((stl) => {
      const total = (Number(stl.ceoShare) || 0) + (Number(stl.developerShare) || 0) + (Number(stl.advisorShare) || 0);
      if (total > 0) {
        transactions.push({
          id: stl.id,
          date: stl.createdAt.toISOString(),
          type: "SETTLEMENT",
          category: "Profit / Talent Settlement",
          description: `Period Settlement: ${stl.period}`,
          paymentMethod: "Settlement",
          amount: total,
          status: stl.status || "PAID"
        });
      }
    });

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      report: {
        period,
        periodLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        companyName: company?.name || "Shohoj Ledger Enterprise",
        currency: "BDT",
        companyPhone: "",
        companyAddress: "",
        generatedAt: now.toISOString(),
        summary: {
          totalIncome,
          totalIncomeReceived,
          accountsReceivable,
          totalDirectExpense,
          totalPayroll,
          totalSettlements,
          totalAdvancesIssued,
          totalAllExpenses,
          netProfit,
          profitMargin,
          totalCashIn,
          totalCashOut,
          netCashFlow
        },
        incomeByCategory,
        expensesByCategory,
        paymentMethodsBreakdown,
        timelineTrend,
        transactionsCount: transactions.length,
        transactions
      }
    });
  } catch (error: any) {
    console.error("Comprehensive finance report error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to generate financial report" 
    }, { status: 500 });
  }
}
