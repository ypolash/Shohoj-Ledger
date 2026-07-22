import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { requireModule } from "@/lib/modules/moduleGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const moduleGuard = await requireModule(companyId, "ACCOUNTING");
    if (moduleGuard) return moduleGuard;

    const rbacGuard = await requirePermission("VIEW_FINANCIAL_REPORTS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const reportType = url.searchParams.get("type");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    
    // Base filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    switch (reportType) {
      case "TRIAL_BALANCE": {
        const entries = await prisma.ledgerEntry.groupBy({
          by: ['accountType'],
          where: { 
            companyId,
            ...(hasDateFilter ? { date: dateFilter } : {})
          },
          _sum: { debit: true, credit: true },
        });
        const report = entries.map(e => ({
          accountType: e.accountType,
          totalDebit: e._sum.debit || 0,
          totalCredit: e._sum.credit || 0,
        }));
        return NextResponse.json({ report });
      }

      case "PROFIT_LOSS": {
        const income = await prisma.income.aggregate({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true },
        });
        const expense = await prisma.expense.aggregate({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true },
        });
        return NextResponse.json({ 
          report: [{
            totalIncome: income._sum.amount || 0,
            totalExpense: expense._sum.amount || 0,
            netProfit: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0)
          }] 
        });
      }

      case "BALANCE_SHEET": {
        // Simplified mapping from ledger
        const entries = await prisma.ledgerEntry.groupBy({
          by: ['accountType'],
          where: { companyId, ...(hasDateFilter ? { date: dateFilter } : {}) },
          _sum: { debit: true, credit: true },
        });
        
        let assets = 0;
        let liabilities = 0;
        let equity = 0;

        entries.forEach(e => {
          const bal = Number(e._sum.debit || 0) - Number(e._sum.credit || 0);
          if (e.accountType === "ASSET" || e.accountType === "CASH" || e.accountType === "BANK") assets += bal;
          else if (e.accountType === "LIABILITY" || e.accountType === "LOAN") liabilities -= bal;
          else if (e.accountType === "EQUITY" || e.accountType === "CAPITAL" || e.accountType === "RESERVE") equity -= bal;
        });

        return NextResponse.json({ report: [{ assets, liabilities, equity }] });
      }

      case "CASH_FLOW": {
        const entries = await prisma.ledgerEntry.findMany({
          where: { 
            companyId, 
            accountType: { in: ["CASH", "BANK"] },
            ...(hasDateFilter ? { date: dateFilter } : {})
          },
          select: { module: true, debit: true, credit: true }
        });
        
        let cashIn = 0;
        let cashOut = 0;
        entries.forEach(e => {
          cashIn += Number(e.debit);
          cashOut += Number(e.credit);
        });

        return NextResponse.json({ report: [{ cashIn, cashOut, netCashFlow: cashIn - cashOut }] });
      }

      case "GENERAL_LEDGER": {
        const entries = await prisma.ledgerEntry.findMany({
          where: { companyId, ...(hasDateFilter ? { date: dateFilter } : {}) },
          orderBy: { date: 'desc' },
          take: 1000 // Limit to avoid massive payloads, filtering can be added
        });
        return NextResponse.json({ report: entries });
      }

      case "ACCOUNT_LEDGER": {
        const accountType = url.searchParams.get("accountType");
        if (!accountType) return NextResponse.json({ error: "Missing accountType" }, { status: 400 });
        const entries = await prisma.ledgerEntry.findMany({
          where: { 
            companyId, 
            accountType,
            ...(hasDateFilter ? { date: dateFilter } : {})
          },
          orderBy: { date: 'desc' },
        });
        return NextResponse.json({ report: entries });
      }

      case "INCOME_STATEMENT": {
        const categories = await prisma.income.groupBy({
          by: ['category'],
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true, received: true },
        });
        return NextResponse.json({ report: categories });
      }

      case "EXPENSE_STATEMENT": {
        const categories = await prisma.expense.groupBy({
          by: ['category'],
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true },
        });
        return NextResponse.json({ report: categories });
      }

      case "PAYROLL_COST": {
        const payrolls = await prisma.salaryPayment.groupBy({
          by: ['month', 'year', 'status'],
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          _sum: { grossSalary: true, netSalary: true },
        });
        return NextResponse.json({ report: payrolls });
      }

      case "DEPARTMENT_EXPENSE": {
        // Find salary by department
        const employees = await prisma.employee.findMany({
          where: { companyId },
          select: { id: true, departmentRef: { select: { name: true } } }
        });
        
        const salaries = await prisma.salaryPayment.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          select: { employeeId: true, netSalary: true }
        });

        const deptCosts: Record<string, number> = {};
        salaries.forEach(s => {
          const emp = employees.find(e => e.id === s.employeeId);
          const deptName = emp?.departmentRef?.name || "Unassigned";
          if (!deptCosts[deptName]) deptCosts[deptName] = 0;
          deptCosts[deptName] += Number(s.netSalary);
        });

        const report = Object.keys(deptCosts).map(dept => ({
          department: dept,
          totalExpense: deptCosts[dept]
        }));
        
        return NextResponse.json({ report });
      }

      case "MEMBER_LOAN": {
        const loans = await prisma.memberLoan.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ report: loans });
      }

      case "ADVANCE": {
        const advances = await prisma.advance.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ report: advances });
      }

      case "SETTLEMENT": {
        const settlements = await prisma.settlement.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ report: settlements });
      }

      case "RESERVE": {
        const reserves = await prisma.reserveTransaction.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ report: reserves });
      }

      case "FUND": {
        const funds = await prisma.fundTransaction.findMany({
          where: { companyId, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ report: funds });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
