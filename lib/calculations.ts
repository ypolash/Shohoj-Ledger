/**
 * Financial Calculation Utilities for Shohoj Ledger
 */

export interface ProfitDistributionRatios {
  ceoRatio?: number;
  developerRatio?: number;
  advisorRatio?: number;
  companyRatio?: number;
}

/**
 * Calculates profit settlement shares among partners and company reserve.
 * If netProfit is negative (loss), shares are zero and the loss is absorbed by the company reserve.
 */
export function calculateSettlement(
  netProfit: number,
  category: string = 'General',
  ratios: ProfitDistributionRatios = {}
) {
  const ceoPct = ratios.ceoRatio ?? 0.40;
  const devPct = ratios.developerRatio ?? 0.20;
  const advPct = ratios.advisorRatio ?? 0.20;
  const compPct = ratios.companyRatio ?? 0.20;

  if (netProfit <= 0) {
    // In a net loss scenario, partners receive 0 dividend and the full loss is recorded in the company share
    return {
      ceo: 0,
      developer: 0,
      advisor: 0,
      company: Math.round(netProfit * 100) / 100,
    };
  }

  return {
    ceo: Math.round(netProfit * ceoPct * 100) / 100,
    developer: Math.round(netProfit * devPct * 100) / 100,
    advisor: Math.round(netProfit * advPct * 100) / 100,
    company: Math.round(netProfit * compPct * 100) / 100,
  };
}

/**
 * Offsets a partner's share against their outstanding due/advance balance.
 */
export function applyDueBalance(share: number, due: number) {
  const safeShare = Math.max(0, Number(share) || 0);
  const safeDue = Math.max(0, Number(due) || 0);

  const payable = Math.max(safeShare - safeDue, 0);
  const remainingDue = Math.max(safeDue - safeShare, 0);

  return {
    payable: Math.round(payable * 100) / 100,
    remainingDue: Math.round(remainingDue * 100) / 100,
  };
}
