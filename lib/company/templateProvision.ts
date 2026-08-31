import { Prisma } from "@prisma/client";

export interface IndustryTemplateData {
  departments: string[];
  jobTitles: string[];
}

/**
 * Industry Template Provisioning (Version 2.4)
 * Provides boilerplate departments and job titles based on selected industry template.
 */
export async function provisionIndustryTemplate(
  tx: Prisma.TransactionClient,
  companyId: string,
  templateName: string
): Promise<IndustryTemplateData> {
  const normalized = (templateName || "").toLowerCase();

  let departments: string[] = ["Management", "Finance", "Human Resources", "Sales & Marketing"];
  let jobTitles: string[] = ["Chief Executive Officer", "General Manager", "Accountant", "HR Executive"];

  if (normalized.includes("it") || normalized.includes("software")) {
    departments = ["Engineering", "Product Design", "Quality Assurance", "Human Resources", "Finance", "Sales & Marketing", "Customer Support"];
    jobTitles = ["Software Engineer", "Frontend Developer", "Backend Developer", "UI/UX Designer", "QA Engineer", "Product Manager", "Support Specialist"];
  } else if (normalized.includes("retail") || normalized.includes("commerce")) {
    departments = ["Store Operations", "Inventory & Warehouse", "Purchasing", "Billing & Cashier", "Sales & Marketing", "Customer Service"];
    jobTitles = ["Store Manager", "Inventory Specialist", "Cashier", "Sales Executive", "Procurement Officer", "Visual Merchandiser"];
  } else if (normalized.includes("manufactur") || normalized.includes("factory")) {
    departments = ["Production", "Quality Control", "Plant Maintenance", "Supply Chain", "Warehouse & Logistics", "Finance & Accounts", "Safety"];
    jobTitles = ["Plant Manager", "Production Supervisor", "Quality Assurance Inspector", "Maintenance Engineer", "Logistics Coordinator"];
  } else if (normalized.includes("wholesale") || normalized.includes("distribut")) {
    departments = ["Supply Chain", "Fleet & Logistics", "Warehouse Dispatch", "Accounts Receivable", "Key Account Sales", "Procurement"];
    jobTitles = ["Distribution Manager", "Dispatch Supervisor", "Logistics Executive", "Procurement Specialist", "Account Manager"];
  } else if (normalized.includes("health") || normalized.includes("pharmacy")) {
    departments = ["Clinical Operations", "Pharmacy Dispensing", "Medical Records", "Billing & Insurance", "Administration", "Procurement"];
    jobTitles = ["Medical Director", "Chief Pharmacist", "Clinical Coordinator", "Billing Executive", "Administrative Officer"];
  } else if (normalized.includes("consult") || normalized.includes("professional")) {
    departments = ["Advisory & Strategy", "Client Relations", "Research & Analytics", "Finance & Compliance", "Operations"];
    jobTitles = ["Principal Consultant", "Senior Associate", "Business Analyst", "Compliance Officer", "Client Engagement Lead"];
  }

  return { departments, jobTitles };
}
