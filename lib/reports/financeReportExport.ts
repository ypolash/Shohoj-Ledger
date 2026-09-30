import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function formatCurrency(amount: number, currency: string = "BDT"): string {
  const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : currency === "EUR" ? "€" : `${currency} `;
  return `${symbol} ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Exports comprehensive financial report to a well-structured CSV file.
 */
export function exportFinancialReportToCSV(reportData: any) {
  if (!reportData) {
    alert("No report data available to export");
    return;
  }

  const {
    companyName,
    periodLabel,
    startDate,
    endDate,
    currency,
    generatedAt,
    summary,
    incomeByCategory = [],
    expensesByCategory = [],
    transactions = []
  } = reportData;

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[] = [];

  // Header & Metadata
  rows.push(`${escapeCSV(companyName)} - FINANCIAL PERFORMANCE & STATEMENT REPORT`);
  rows.push(`Period:,${escapeCSV(periodLabel)}`);
  rows.push(`Date Range:,${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`);
  rows.push(`Currency:,${escapeCSV(currency)}`);
  rows.push(`Generated On:,${new Date(generatedAt).toLocaleString()}`);
  rows.push(""); // blank line

  // Executive Summary Section
  rows.push("--- EXECUTIVE FINANCIAL SUMMARY ---");
  rows.push(`Gross Income / Revenue:,${summary.totalIncome.toFixed(2)}`);
  rows.push(`Total Operating Expenses:,${summary.totalDirectExpense.toFixed(2)}`);
  rows.push(`Payroll & Staff Salaries:,${summary.totalPayroll.toFixed(2)}`);
  rows.push(`Talent & Partner Settlements:,${summary.totalSettlements.toFixed(2)}`);
  rows.push(`Total Outflows & Expenses:,${summary.totalAllExpenses.toFixed(2)}`);
  rows.push(`NET OPERATING PROFIT:,${summary.netProfit.toFixed(2)}`);
  rows.push(`Profit Margin (%):,${summary.profitMargin}%`);
  rows.push(`Operating Cash Inflows:,${summary.totalCashIn.toFixed(2)}`);
  rows.push(`Operating Cash Outflows:,${summary.totalCashOut.toFixed(2)}`);
  rows.push(`NET CASH FLOW:,${summary.netCashFlow.toFixed(2)}`);
  rows.push(`Accounts Receivable (Pending):,${summary.accountsReceivable.toFixed(2)}`);
  rows.push(""); // blank line

  // Income Category Breakdown
  rows.push("--- REVENUE BY CATEGORY ---");
  rows.push("Category,Total Amount,Transactions Count,Share (%)");
  incomeByCategory.forEach((inc: any) => {
    rows.push(`${escapeCSV(inc.category)},${inc.total.toFixed(2)},${inc.count},${inc.percentage}%`);
  });
  rows.push(`Total Revenue,${summary.totalIncome.toFixed(2)},,100.0%`);
  rows.push(""); // blank line

  // Expense Category Breakdown
  rows.push("--- EXPENSES BY CATEGORY ---");
  rows.push("Category,Total Amount,Transactions Count,Share (%)");
  expensesByCategory.forEach((exp: any) => {
    rows.push(`${escapeCSV(exp.category)},${exp.total.toFixed(2)},${exp.count},${exp.percentage}%`);
  });
  rows.push(`Total Outflows,${summary.totalAllExpenses.toFixed(2)},,100.0%`);
  rows.push(""); // blank line

  // Detailed Transaction Ledger
  rows.push("--- DETAILED TRANSACTION LEDGER ---");
  rows.push("Date,Type,Category,Description,Payment Method,Amount,Status,Reference");
  transactions.forEach((tx: any) => {
    rows.push([
      escapeCSV(new Date(tx.date).toLocaleDateString()),
      escapeCSV(tx.type),
      escapeCSV(tx.category),
      escapeCSV(tx.description),
      escapeCSV(tx.paymentMethod),
      tx.amount.toFixed(2),
      escapeCSV(tx.status),
      escapeCSV(tx.reference || "")
    ].join(","));
  });

  const csvContent = rows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanLabel = (periodLabel || "Report").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.href = url;
  link.setAttribute("download", `Finance_Report_${cleanLabel}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports comprehensive financial report to a formatted multi-page PDF document.
 */
export function exportFinancialReportToPDF(reportData: any) {
  if (!reportData) {
    alert("No report data available to export");
    return;
  }

  const {
    companyName = "Shohoj Ledger Enterprise",
    periodLabel = "Period",
    startDate,
    endDate,
    currency = "BDT",
    generatedAt,
    summary,
    incomeByCategory = [],
    expensesByCategory = [],
    transactions = []
  } = reportData;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, "F");

  // Accent Line
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(0, 32, pageWidth, 2, "F");

  // Header Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName.toUpperCase(), margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("EXECUTIVE FINANCIAL PERFORMANCE & STATEMENT REPORT", margin, 18);

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Period: ${periodLabel}`, margin, 25);
  doc.text(`Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, margin + 65, 25);

  const genStr = `Exported: ${new Date(generatedAt).toLocaleString()}`;
  doc.text(genStr, pageWidth - margin - doc.getTextWidth(genStr), 25);

  // Section 1: Executive KPI Grid Table
  let currentY = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("1. EXECUTIVE FINANCIAL SUMMARY", margin, currentY);
  currentY += 4;

  const summaryBody = [
    [
      "Total Gross Revenue / Income",
      formatCurrency(summary.totalIncome, currency),
      "Operating Cash Inflows",
      formatCurrency(summary.totalCashIn, currency)
    ],
    [
      "Total Operating Expenses",
      formatCurrency(summary.totalDirectExpense, currency),
      "Operating Cash Outflows",
      formatCurrency(summary.totalCashOut, currency)
    ],
    [
      "Payroll & Staff Salaries",
      formatCurrency(summary.totalPayroll, currency),
      "Net Cash Flow (Liquidity)",
      formatCurrency(summary.netCashFlow, currency)
    ],
    [
      "Talent / Partner Settlements",
      formatCurrency(summary.totalSettlements, currency),
      "Accounts Receivable (Due)",
      formatCurrency(summary.accountsReceivable, currency)
    ],
    [
      "TOTAL EXPENDITURES & OUTFLOWS",
      formatCurrency(summary.totalAllExpenses, currency),
      "NET PROFIT MARGIN",
      `${summary.profitMargin}%`
    ],
    [
      "NET OPERATING PROFIT / (LOSS)",
      formatCurrency(summary.netProfit, currency),
      "PROFIT STATUS",
      summary.netProfit >= 0 ? "PROFITABLE (+)" : "DEFICIT (-)"
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Financial Metric", "Amount", "Cash & Health Metric", "Amount / Ratio"]],
    body: summaryBody,
    theme: "striped",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 35 },
      2: { fontStyle: "bold", cellWidth: 55 },
      3: { halign: "right", cellWidth: 35 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Category Breakdown Side by Side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("2. REVENUE & EXPENSE STREAM BREAKDOWN", margin, currentY);
  currentY += 4;

  const incomeRows = incomeByCategory.map((inc: any) => [
    inc.category,
    formatCurrency(inc.total, currency),
    `${inc.percentage}%`
  ]);
  if (incomeRows.length === 0) incomeRows.push(["No recorded revenue in period", formatCurrency(0, currency), "0%"]);

  const expenseRows = expensesByCategory.map((exp: any) => [
    exp.category,
    formatCurrency(exp.total, currency),
    `${exp.percentage}%`
  ]);
  if (expenseRows.length === 0) expenseRows.push(["No recorded expenses in period", formatCurrency(0, currency), "0%"]);

  // Income Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: pageWidth / 2 + 2 },
    tableWidth: (pageWidth - margin * 2) / 2 - 2,
    head: [["Revenue Stream", "Amount", "Share"]],
    body: incomeRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } }
  });

  const incomeTableFinalY = (doc as any).lastAutoTable.finalY;

  // Expense Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: pageWidth / 2 + 2, right: margin },
    tableWidth: (pageWidth - margin * 2) / 2 - 2,
    head: [["Expense Category", "Amount", "Share"]],
    body: expenseRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "center" } }
  });

  const expenseTableFinalY = (doc as any).lastAutoTable.finalY;
  currentY = Math.max(incomeTableFinalY, expenseTableFinalY) + 8;

  // Section 3: Itemized Detailed Transaction Ledger
  // Add new page if space is low
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`3. DETAILED TRANSACTION LEDGER (${transactions.length} ENTRIES)`, margin, currentY);
  currentY += 4;

  const transactionRows = transactions.slice(0, 150).map((tx: any) => [
    new Date(tx.date).toLocaleDateString(),
    tx.type,
    tx.category,
    tx.description.length > 32 ? `${tx.description.substring(0, 30)}...` : tx.description,
    tx.paymentMethod,
    formatCurrency(tx.amount, currency),
    tx.status
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Date", "Type", "Category", "Description", "Method", "Amount", "Status"]],
    body: transactionRows,
    theme: "striped",
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85]
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18, fontStyle: "bold" },
      2: { cellWidth: 32 },
      3: { cellWidth: 46 },
      4: { cellWidth: 24 },
      5: { cellWidth: 25, halign: "right", fontStyle: "bold" },
      6: { cellWidth: 17, halign: "center" }
    },
    didDrawPage: (data) => {
      // Header for pages > 1
      if (data.pageNumber > 1) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`${companyName} • Financial Report (${periodLabel})`, margin, 10);
      }

      // Footer
      const totalPages = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : doc.internal.pages.length - 1;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated via Shohoj Ledger ERP • Page ${data.pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }
  });

  // Final Sign-off block on last page
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  // Signatures
  doc.line(margin + 10, finalY, margin + 65, finalY);
  doc.line(pageWidth - margin - 65, finalY, pageWidth - margin - 10, finalY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Prepared By (Accountant / CFO)", margin + 15, finalY + 4);
  doc.text("Authorized Signature & Seal", pageWidth - margin - 60, finalY + 4);

  const cleanLabel = (periodLabel || "Report").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Financial_Report_${cleanLabel}_${new Date().toISOString().split("T")[0]}.pdf`);
}
