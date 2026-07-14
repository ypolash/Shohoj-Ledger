export function calculateSettlement(netProfit: number, category: string) {
  if (["Marketing", "Consulting", "Support", "Training"].includes(category)) {
    return {
      ceo: netProfit * 0.5,
      developer: 0,
      company: netProfit * 0.5,
    };
  }

  if (["Development", "Maintenance"].includes(category)) {
    return {
      ceo: netProfit * 0.4,
      developer: netProfit * 0.2,
      company: netProfit * 0.4,
    };
  }

  return {
    ceo: netProfit * 0.5,
    developer: 0,
    company: netProfit * 0.5,
  };
}

export function applyDueBalance(share: number, due: number) {
  const payable = Math.max(share - due, 0);
  const remainingDue = Math.max(due - share, 0);

  return { payable, remainingDue };
}
