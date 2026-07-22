export type PayrollCalculationResult = {
  basicSalary: number;
  grossSalary: number; // Basic + Bonuses
  netSalary: number;   // Gross - Deductions
  totalDeductions: number;
  totalBonuses: number;
  deductions: { type: string; amount: number; reason: string }[];
  bonuses: { type: string; amount: number; reason: string }[];
  workingDays: number;
};

export function calculatePayroll(
  basicSalary: number,
  workingDays: number, // Total standard working days in the month
  attendances: any[], // Array of attendance records for the month
  leaveRequests: any[], // Array of approved/unapproved leave requests for the month
  bonuses: any[] // Pre-created bonuses for the month
): PayrollCalculationResult {
  // Prevent division by zero
  if (workingDays <= 0) workingDays = 22; 
  const dailyRate = basicSalary / workingDays;
  const deductions: { type: string; amount: number; reason: string }[] = [];
  let totalDeductionAmount = 0;

  // Process Attendances
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
          reason: `Punishment on ${new Date(att.date).toLocaleDateString()}: ${att.punishmentReason || 'N/A'}`
       });
       totalDeductionAmount += amount;
    }
  });

  // Calculate total bonuses
  let totalBonusAmount = 0;
  const bonusDetails = bonuses.map(b => {
    const amount = Number(b.amount);
    totalBonusAmount += amount;
    return {
      type: b.type,
      amount: amount,
      reason: b.reason || ''
    };
  });

  let netSalary = basicSalary - totalDeductionAmount + totalBonusAmount;
  // Ensure net salary is not negative
  if (netSalary < 0) netSalary = 0;

  return {
    basicSalary,
    grossSalary: basicSalary + totalBonusAmount, // Gross is basic + bonuses
    netSalary,
    totalDeductions: totalDeductionAmount,
    totalBonuses: totalBonusAmount,
    deductions,
    bonuses: bonusDetails,
    workingDays
  };
}
