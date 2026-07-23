import { postingService, PostingRequest } from "@/lib/accounting/postingService";
import { Decimal } from "@prisma/client/runtime/library";

export const payrollAccountingService = {
  validatePayrollPosting: (isApproved: boolean, companyId: string, branchId?: string) => {
    if (!isApproved) {
      throw new Error("Cannot post unapproved payroll document to Accounting.");
    }
    if (!companyId) {
      throw new Error("Company ID is required for Payroll Accounting integration.");
    }
  },

  postPayroll: async (
    companyId: string, 
    payrollRunId: string, 
    grossSalary: number | Decimal, 
    employerTaxes: number | Decimal,
    netSalary: number | Decimal,
    taxLiabilities: number | Decimal,
    salaryExpenseAccountId: string,
    taxExpenseAccountId: string,
    taxLiabilityAccountId: string,
    salaryPayableAccountId: string,
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // Salary Accrual
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Payroll Run Accrual #${payrollRunId}`,
      referenceType: 'PAYROLL_RUN',
      referenceId: payrollRunId,
      createdById: postedById,
      lines: [
        { accountId: salaryExpenseAccountId, debit: grossSalary, credit: 0, description: "Gross Salary Expense" },
        { accountId: taxExpenseAccountId, debit: employerTaxes, credit: 0, description: "Employer Tax Expense" },
        { accountId: taxLiabilityAccountId, debit: 0, credit: taxLiabilities, description: "Tax & Withholding Liabilities" },
        { accountId: salaryPayableAccountId, debit: 0, credit: netSalary, description: "Net Salary Payable" }
      ]
    };

    return postingService.post(request);
  },

  postSalaryPayment: async (
    companyId: string, 
    paymentId: string, 
    amount: number | Decimal, 
    salaryPayableAccountId: string, 
    cashAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // Payment of accrued salary
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Salary Payment #${paymentId}`,
      referenceType: 'SALES_PAYMENT', // In phase 2 we should use PAYROLL_PAYMENT
      referenceId: paymentId,
      createdById: postedById,
      lines: [
        { accountId: salaryPayableAccountId, debit: amount, credit: 0, description: "Salary Payable Cleared" },
        { accountId: cashAccountId, debit: 0, credit: amount, description: "Cash/Bank Disbursed" }
      ]
    };

    return postingService.post(request);
  },

  postBonus: async (
    companyId: string, 
    bonusId: string, 
    amount: number | Decimal, 
    bonusExpenseAccountId: string, 
    cashAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Bonus Payment #${bonusId}`,
      referenceType: 'PAYROLL_BONUS',
      referenceId: bonusId,
      createdById: postedById,
      lines: [
        { accountId: bonusExpenseAccountId, debit: amount, credit: 0, description: "Bonus Expense" },
        { accountId: cashAccountId, debit: 0, credit: amount, description: "Cash/Bank Disbursed" }
      ]
    };

    return postingService.post(request);
  },

  postAllowance: async (
    companyId: string, 
    allowanceId: string, 
    amount: number | Decimal, 
    allowanceExpenseAccountId: string, 
    cashAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Allowance Payment #${allowanceId}`,
      referenceType: 'PAYROLL_ALLOWANCE',
      referenceId: allowanceId,
      createdById: postedById,
      lines: [
        { accountId: allowanceExpenseAccountId, debit: amount, credit: 0, description: "Allowance Expense" },
        { accountId: cashAccountId, debit: 0, credit: amount, description: "Cash/Bank Disbursed" }
      ]
    };

    return postingService.post(request);
  },

  postDeduction: async (
    companyId: string, 
    deductionId: string, 
    amount: number | Decimal, 
    deductionLiabilityAccountId: string, 
    salaryPayableAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    // Often handled during payroll run, but if isolated:
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Payroll Deduction #${deductionId}`,
      referenceType: 'PAYROLL_DEDUCTION',
      referenceId: deductionId,
      createdById: postedById,
      lines: [
        { accountId: salaryPayableAccountId, debit: amount, credit: 0, description: "Salary Payable Reduced" },
        { accountId: deductionLiabilityAccountId, debit: 0, credit: amount, description: "Deduction Liability Increased" }
      ]
    };

    return postingService.post(request);
  },

  postLoanRecovery: async (
    companyId: string, 
    recoveryId: string, 
    amount: number | Decimal, 
    cashAccountId: string, 
    employeeLoanAccountId: string, 
    postedById: string,
    journalId: string,
    branchId?: string
  ) => {
    const request: PostingRequest = {
      companyId,
      branchId,
      journalId,
      entryDate: new Date(),
      description: `Loan Recovery #${recoveryId}`,
      referenceType: 'PAYROLL_LOAN_RECOVERY',
      referenceId: recoveryId,
      createdById: postedById,
      lines: [
        { accountId: cashAccountId, debit: amount, credit: 0, description: "Cash Recovered" },
        { accountId: employeeLoanAccountId, debit: 0, credit: amount, description: "Employee Loan Asset Reduced" }
      ]
    };

    return postingService.post(request);
  },

  reversePayrollPosting: async (
    companyId: string, 
    referenceType: string, 
    referenceId: string, 
    reversedById: string
  ) => {
    return postingService.reverse(companyId, referenceType, referenceId, reversedById);
  }
};
