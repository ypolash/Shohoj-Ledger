export type PayrollCalculationResult = {
  basicSalary: number;
  grossSalary: number; // Basic + Bonuses + Task Rewards + Overtime
  netSalary: number;   // Gross - Deductions (including fines, advances, loans, late/absent)
  totalDeductions: number;
  totalBonuses: number;
  totalOvertimePay: number;
  totalTaskRewards: number;
  totalFinesDeducted: number;
  totalAdvanceDeducted: number;
  totalLoanDeducted: number;
  deductions: { type: string; amount: number; reason: string; referenceId?: string; referenceType?: string }[];
  bonuses: { type: string; amount: number; reason: string }[];
  workingDays: number;
};

export function calculatePayroll(
  basicSalary: number,
  workingDays: number, // Total standard working days in the month
  attendances: any[] = [], // Array of attendance records for the month
  leaveRequests: any[] = [], // Array of approved/unapproved leave requests for the month
  bonuses: any[] = [], // Pre-created bonuses for the month
  fines: any[] = [], // Pending fines for the employee
  advances: any[] = [], // Active salary advances for the employee
  loans: any[] = [], // Active employee loans
  taskRewards: any[] = [], // Approved task reward submissions/payouts for the month
  overtimes: any[] = [] // Approved overtimes for the month
): PayrollCalculationResult {
  // Prevent division by zero
  if (workingDays <= 0) workingDays = 22; 
  const dailyRate = basicSalary / workingDays;
  const hourlyRate = dailyRate / 8; // Assuming standard 8-hour workday
  const deductions: { type: string; amount: number; reason: string; referenceId?: string; referenceType?: string }[] = [];
  let totalDeductionAmount = 0;

  // 1. Process Attendances (Absences & Late arrival penalties)
  attendances.forEach(att => {
    if (att.status === 'ABSENT') {
      // Check if they have an approved leave for this date
      const hasApprovedLeave = leaveRequests.some(lr => 
        lr.status === 'APPROVED' && 
        new Date(att.date).getTime() >= new Date(lr.startDate).getTime() && 
        new Date(att.date).getTime() <= new Date(lr.endDate).getTime()
      );

      if (!hasApprovedLeave) {
        deductions.push({
          type: 'UNPAID_LEAVE',
          amount: dailyRate,
          reason: `Unapproved absence on ${new Date(att.date).toLocaleDateString()}`
        });
        totalDeductionAmount += dailyRate;
      }
    } else if (att.status === 'LATE' || att.lateMinutes > 0) {
      if (att.lateMinutes >= 16 && att.lateMinutes <= 60) {
        // half day deduction
        const amount = dailyRate / 2;
        deductions.push({
          type: 'LATE_FEE',
          amount: amount,
          reason: `Late by ${att.lateMinutes} mins on ${new Date(att.date).toLocaleDateString()} (Half day deduction)`
        });
        totalDeductionAmount += amount;
      } else if (att.lateMinutes > 60) {
        // full day deduction
        deductions.push({
          type: 'LATE_FEE',
          amount: dailyRate,
          reason: `Late by ${att.lateMinutes} mins on ${new Date(att.date).toLocaleDateString()} (Full day deduction)`
        });
        totalDeductionAmount += dailyRate;
      }
    }
    
    // Process punishment deduction if any exists from attendance review
    if (att.punishmentAmount && Number(att.punishmentAmount) > 0) {
       const amount = Number(att.punishmentAmount);
       deductions.push({
          type: 'OTHER',
          amount: amount,
          reason: `Attendance Penalty on ${new Date(att.date).toLocaleDateString()}: ${att.punishmentReason || 'Violation'}`
       });
       totalDeductionAmount += amount;
    }
  });

  // 2. Process Pending Fines (EmployeeFine)
  let totalFinesDeducted = 0;
  fines.forEach(fine => {
    const fineAmt = Number(fine.amount) || 0;
    if (fineAmt > 0) {
      deductions.push({
        type: 'FINE',
        amount: fineAmt,
        reason: fine.reason ? `Fine: ${fine.reason}` : 'Administrative fine penalty',
        referenceId: fine.id,
        referenceType: 'EmployeeFine'
      });
      totalDeductionAmount += fineAmt;
      totalFinesDeducted += fineAmt;
    }
  });

  // 3. Process Salary Advances (Advance / SalaryAdvance)
  let totalAdvanceDeducted = 0;
  advances.forEach(adv => {
    const remAmt = Number(adv.remainingAmount ?? adv.amount) || 0;
    if (remAmt > 0) {
      // Deduct either monthly installment or remaining amount
      const deductAmt = Math.min(remAmt, Number(adv.monthlyDeduction || remAmt));
      if (deductAmt > 0) {
        deductions.push({
          type: 'ADVANCE',
          amount: deductAmt,
          reason: `Salary Advance Recovery (${adv.reason || 'Installment'})`,
          referenceId: adv.id,
          referenceType: 'SalaryAdvance'
        });
        totalDeductionAmount += deductAmt;
        totalAdvanceDeducted += deductAmt;
      }
    }
  });

  // 4. Process Employee Loans
  let totalLoanDeducted = 0;
  loans.forEach(loan => {
    const remLoan = Number(loan.remainingAmount ?? loan.amount) || 0;
    if (remLoan > 0) {
      const emiAmt = Math.min(remLoan, Number(loan.monthlyEmi || loan.emi || remLoan));
      if (emiAmt > 0) {
        deductions.push({
          type: 'LOAN',
          amount: emiAmt,
          reason: `Loan Repayment EMI: ${loan.reason || loan.loanNumber || 'Installment'}`,
          referenceId: loan.id,
          referenceType: 'EmployeeLoan'
        });
        totalDeductionAmount += emiAmt;
        totalLoanDeducted += emiAmt;
      }
    }
  });

  // 5. Calculate Bonuses
  let totalBonusAmount = 0;
  const bonusDetails = bonuses.map(b => {
    const amount = Number(b.amount) || 0;
    totalBonusAmount += amount;
    return {
      type: b.type || 'PERFORMANCE',
      amount: amount,
      reason: b.reason || ''
    };
  });

  // 6. Calculate Task Rewards
  let totalTaskRewards = 0;
  taskRewards.forEach(tr => {
    const rewAmt = Number(tr.rewardAmount ?? tr.pointsAwarded ?? 0) || 0;
    if (rewAmt > 0) {
      totalTaskRewards += rewAmt;
      bonusDetails.push({
        type: 'TASK_REWARD',
        amount: rewAmt,
        reason: `Task Reward: ${tr.taskReward?.title || tr.reviewNotes || 'Completed Objective'}`
      });
    }
  });

  // 7. Calculate Overtime Earnings
  let totalOvertimePay = 0;
  overtimes.forEach(ot => {
    const hours = Number(ot.hours) || 0;
    const rateMultiplier = Number(ot.rate) || 1.5;
    if (hours > 0) {
      const otAmt = hours * hourlyRate * rateMultiplier;
      totalOvertimePay += otAmt;
      bonusDetails.push({
        type: 'OVERTIME',
        amount: otAmt,
        reason: `Overtime (${hours} hrs @ ${rateMultiplier}x rate)`
      });
    }
  });

  const totalEarnings = basicSalary + totalBonusAmount + totalTaskRewards + totalOvertimePay;
  let netSalary = totalEarnings - totalDeductionAmount;
  // Ensure net salary is not negative
  if (netSalary < 0) netSalary = 0;

  return {
    basicSalary,
    grossSalary: totalEarnings,
    netSalary,
    totalDeductions: totalDeductionAmount,
    totalBonuses: totalBonusAmount,
    totalOvertimePay,
    totalTaskRewards,
    totalFinesDeducted,
    totalAdvanceDeducted,
    totalLoanDeducted,
    deductions,
    bonuses: bonusDetails,
    workingDays
  };
}
