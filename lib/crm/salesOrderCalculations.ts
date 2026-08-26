/**
 * Calculates totals for a Sales Order.
 */
export function calculateTotals(lines: any[], globalDiscount: number = 0, globalShipping: number = 0, globalTaxRate: number = 0) {
  let grossSubtotal = 0;
  let lineDiscountsTotal = 0;
  let taxAmount = 0;

  const processedLines = lines.map(line => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const discPct = Number(line.discountPercent) || 0;
    const taxPct = Number(line.taxPercent) || 0;

    const grossLineTotal = qty * price;
    // Prefer explicitly provided discountAmount, fallback to percentage-based calculation
    const discountAmt = line.discountAmount !== undefined ? Number(line.discountAmount) : (grossLineTotal * (discPct / 100));
    const lineSubtotal = grossLineTotal - discountAmt;
    
    // Prefer explicitly provided taxAmount, fallback to percentage-based calculation
    const lineTaxAmt = line.taxAmount !== undefined ? Number(line.taxAmount) : (lineSubtotal * (taxPct / 100));
    const lineTotal = lineSubtotal + lineTaxAmt;

    grossSubtotal += grossLineTotal;
    lineDiscountsTotal += discountAmt;
    taxAmount += lineTaxAmt;

    return {
      ...line,
      quantity: qty,
      unitPrice: price,
      discountPercent: discPct,
      taxPercent: taxPct,
      discountAmount: discountAmt,
      taxAmount: lineTaxAmt,
      lineTotal
    };
  });

  const totalDiscount = lineDiscountsTotal + globalDiscount;
  const taxableAmount = Math.max(0, grossSubtotal - totalDiscount);
  // If globalTaxRate is provided, override the summed line tax amount
  if (globalTaxRate > 0) {
    taxAmount = (taxableAmount * globalTaxRate) / 100;
  }

  const totalAmount = taxableAmount + taxAmount + globalShipping;

  return {
    subtotal: grossSubtotal,
    taxAmount,
    shippingAmount: globalShipping,
    discountAmount: totalDiscount,
    totalAmount,
    processedLines
  };
}
