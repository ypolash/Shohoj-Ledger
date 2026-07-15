export type PayrollCalculationResult = {
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
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
  const dailyRate = basicSalary / workingDays;
  const deductions: { type: string; amount: number; reason: string }[] = [];
  let totalDeductionAmount = 0;

  // Process Attendances
  attendances.forEach(att => {
    if (att.status === 'ABSENT') {
      // Check if they have an approved leave for this date
      // Note: In real logic, we'd check if the att.date falls within an APPROVED leaveRequest startDate-endDate
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

  const netSalary = basicSalary - totalDeductionAmount + totalBonusAmount;

  return {
    basicSalary,
    grossSalary: basicSalary + totalBonusAmount, // Gross is before deductions
    netSalary: netSalary > 0 ? netSalary : 0,
    deductions,
    bonuses: bonusDetails,
    workingDays
  };
}
