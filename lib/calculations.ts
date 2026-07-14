export function calculateSettlement(netProfit: number, category: string) {
  return {
    ceo: netProfit * 0.4,
    developer: netProfit * 0.2,
    advisor: netProfit * 0.2,
    company: netProfit * 0.2,
  };
}

export function applyDueBalance(share: number, due: number) {
  const payable = Math.max(share - due, 0);
  const remainingDue = Math.max(due - share, 0);

  return { payable, remainingDue };
}
