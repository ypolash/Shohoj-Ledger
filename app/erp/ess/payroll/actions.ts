"use server";

import { prisma } from "@/lib/prisma";
import { getEssEmployeeId } from "../actions";

export async function fetchMyPayroll() {
  const { employeeId, companyId } = await getEssEmployeeId();

  const [payments, payslips, bonuses, deductions] = await Promise.all([
    prisma.salaryPayment.findMany({
      where: { companyId, employeeId },
      orderBy: { paymentDate: "desc" }
    }),
    prisma.payslip.findMany({
      where: { companyId, employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    }),
    prisma.bonus.findMany({
      where: { companyId, employeeId },
      orderBy: { createdAt: "desc" }
    }),
    prisma.salaryDeduction.findMany({
      where: { companyId, employeeId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    payments,
    payslips,
    bonuses,
    deductions
  };
}
