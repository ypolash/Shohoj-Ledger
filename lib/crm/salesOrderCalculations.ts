/**
 * Calculates totals for a Sales Order with exact line item apportionment.
 */
export function calculateTotals(
  lines: any[],
  globalDiscount: number = 0,
  globalShipping: number = 0,
  globalTaxRate: number = 0
) {
  let grossSubtotal = 0;
  let lineDiscountsTotal = 0;
  let lineTaxesTotal = 0;

  const rawProcessed = (lines || []).map((line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const discPct = Number(line.discountPercent) || 0;
    const taxPct = Number(line.taxPercent) || 0;

    const grossLineTotal = qty * price;
    const discountAmt = line.discountAmount !== undefined ? Number(line.discountAmount) : grossLineTotal * (discPct / 100);
    const lineSubtotal = Math.max(0, grossLineTotal - discountAmt);
    const lineTaxAmt = line.taxAmount !== undefined ? Number(line.taxAmount) : lineSubtotal * (taxPct / 100);

    grossSubtotal += grossLineTotal;
    lineDiscountsTotal += discountAmt;
    lineTaxesTotal += lineTaxAmt;

    return {
      ...line,
      quantity: qty,
      unitPrice: price,
      discountPercent: discPct,
      taxPercent: taxPct,
      discountAmount: discountAmt,
      lineSubtotal,
      taxAmount: lineTaxAmt,
    };
  });

  const totalLineSubtotal = rawProcessed.reduce((acc, l) => acc + l.lineSubtotal, 0);
  const totalDiscount = lineDiscountsTotal + Number(globalDiscount || 0);

  // If globalTaxRate is provided, override the summed line tax amount
  let calculatedTaxAmount = lineTaxesTotal;
  if (globalTaxRate > 0) {
    const taxableAmount = Math.max(0, grossSubtotal - totalDiscount);
    calculatedTaxAmount = (taxableAmount * globalTaxRate) / 100;
  }

  const processedLines = rawProcessed.map((l) => {
    const ratio = totalLineSubtotal > 0 ? l.lineSubtotal / totalLineSubtotal : 0;
    const allocatedGlobalDiscount = Number(globalDiscount || 0) * ratio;
    const effectiveSubtotal = Math.max(0, l.lineSubtotal - allocatedGlobalDiscount);

    let effectiveTax = l.taxAmount;
    if (globalTaxRate > 0) {
      effectiveTax = calculatedTaxAmount * ratio;
    }

    const lineTotal = Math.round((effectiveSubtotal + effectiveTax) * 100) / 100;

    return {
      ...l,
      allocatedGlobalDiscount: Math.round(allocatedGlobalDiscount * 100) / 100,
      taxAmount: Math.round(effectiveTax * 100) / 100,
      lineTotal,
    };
  });

  const taxableAmount = Math.max(0, grossSubtotal - totalDiscount);
  const totalAmount = Math.round((taxableAmount + calculatedTaxAmount + Number(globalShipping || 0)) * 100) / 100;

  return {
    subtotal: Math.round(grossSubtotal * 100) / 100,
    taxAmount: Math.round(calculatedTaxAmount * 100) / 100,
    shippingAmount: Number(globalShipping || 0),
    discountAmount: Math.round(totalDiscount * 100) / 100,
    totalAmount,
    processedLines,
  };
}

