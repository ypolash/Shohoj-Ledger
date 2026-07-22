export const DefaultModules = {
  SERVICE_COMPANY: [
    "ACCOUNTING",
    "ATTENDANCE",
    "PAYROLL",
    "CRM",
    "PROJECTS",
    "LEAD_MANAGEMENT"
  ],
  PRODUCT_COMPANY: [
    "INVENTORY",
    "PURCHASE",
    "SALES",
    "ACCOUNTING",
    "CRM"
  ]
};

/**
 * Returns the default module keys based on the business type.
 */
export function getDefaultModules(businessType: string): string[] {
  const type = businessType.toUpperCase();
  
  if (type.includes("SERVICE")) {
    return DefaultModules.SERVICE_COMPANY;
  }
  
  if (type.includes("PRODUCT")) {
    return DefaultModules.PRODUCT_COMPANY;
  }
  
  if (type.includes("BOTH")) {
    const combined = new Set([
      ...DefaultModules.SERVICE_COMPANY,
      ...DefaultModules.PRODUCT_COMPANY
    ]);
    return Array.from(combined);
  }

  // Fallback default
  return ["ACCOUNTING", "CRM"];
}
