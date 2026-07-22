import { Prisma } from "@prisma/client";

/**
 * Industry Template Provisioning
 * Future-proofs the creation of boilerplate structural data (Departments, Job Titles)
 * based on the registered business type.
 * 
 * Note: Since Prisma Schema modifications are locked for Phase 7, this service
 * acts as an architectural placeholder that currently returns the structural 
 * template. In future phases, these arrays will map directly to respective 
 * dictionary tables (e.g., Department, Designation models).
 */
export async function provisionIndustryTemplate(
  tx: Prisma.TransactionClient,
  companyId: string,
  businessType: string
) {
  let templateData = {
    departments: [] as string[],
    jobTitles: [] as string[]
  };

  if (businessType === "IT Company" || businessType === "IT") {
    templateData.departments = [
      "Development",
      "Design",
      "QA",
      "HR",
      "Finance",
      "Sales",
      "Marketing",
      "Support"
    ];

    templateData.jobTitles = [
      "Software Engineer",
      "Backend Developer",
      "Frontend Developer",
      "Android Developer",
      "Flutter Developer",
      "UI Designer",
      "QA Engineer",
      "HR Executive",
      "Accountant",
      "Project Manager",
      "Marketing Executive",
      "Support Executive"
    ];
  }

  // TODO: In a future phase, perform tx.department.createMany() and tx.jobTitle.createMany()
  // once the respective models are added to the Prisma schema.

  return templateData;
}
