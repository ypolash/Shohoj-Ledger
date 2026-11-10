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

  if (normalized.includes("goods") || normalized.includes("consumer") || normalized.includes("retail") || normalized.includes("commerce")) {
    departments = ["Store & Showroom Operations", "Inventory & Warehouse", "Purchasing & Sourcing", "Billing & Cashier", "Sales & Marketing", "Customer Service"];
    jobTitles = ["Store Manager", "Inventory Specialist", "Cashier & POS Operator", "Sales Executive", "Procurement Officer", "Visual Merchandiser"];
  } else if (normalized.includes("hotel") || normalized.includes("resturant") || normalized.includes("restaurant") || normalized.includes("food")) {
    departments = ["Restaurant Operations", "Kitchen & Food Prep", "Front Desk & Reservations", "Inventory & Provisions", "Billing & Cashier", "Housekeeping"];
    jobTitles = ["Restaurant Manager", "Executive Chef", "Floor Captain", "Kitchen Supervisor", "Cashier", "Storekeeper"];
  } else if (normalized.includes("pharmacy") || normalized.includes("pharmecy") || normalized.includes("health")) {
    departments = ["Pharmacy Dispensing", "Medical Inventory & Expiry Control", "Procurement & Suppliers", "Billing & POS", "Regulatory Compliance"];
    jobTitles = ["Chief Pharmacist", "Assistant Pharmacist", "Pharmacy Storekeeper", "Billing Executive", "Inventory Specialist"];
  } else if (normalized.includes("electronic") || normalized.includes("gadget") || normalized.includes("device")) {
    departments = ["Store & Showroom", "Technical Service & Warranty", "Inventory & Serial Tracking", "Procurement & Distribution", "Sales & B2B"];
    jobTitles = ["Showroom Manager", "Technical Support Specialist", "Warranty Coordinator", "Inventory Specialist", "Sales Officer"];
  } else if (normalized.includes("beauty") || normalized.includes("beuty") || normalized.includes("cosmetic")) {
    departments = ["Salon & Retail Operations", "Product Inventory & Stock", "Consultation & Customer Care", "Billing & POS", "Marketing & Promotions"];
    jobTitles = ["Store / Salon Manager", "Beauty Consultant", "Inventory Supervisor", "Cashier", "Brand Promoter"];
  } else if (normalized.includes("it") || normalized.includes("software")) {
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
  } else if (normalized.includes("educat") || normalized.includes("academic") || normalized.includes("school") || normalized.includes("training") || normalized.includes("college") || normalized.includes("university")) {
    departments = ["Academic Affairs", "Faculty & Instructors", "Student Admissions", "Examinations & Grading", "Finance & Accounts", "Administration"];
    jobTitles = ["Academic Dean / Director", "Course Coordinator", "Senior Lecturer / Instructor", "Teaching Assistant", "Admissions Officer", "Registrar"];
  }

  return { departments, jobTitles };
}
