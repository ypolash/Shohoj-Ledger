import React from 'react';
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import EmployeeProfileClient from "./EmployeeProfileClient";

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: params.id,
      companyId: session.user.companyId,
    },
  });

  if (!employee) {
    return <div>Employee not found</div>;
  }

  // Passing raw employee data to the client component
  // Note: Prisma returns Decimal for basicSalary and Date for joinDate/createdAt. 
  // We stringify/serialize them for the Client Component.
  const serializedEmployee = {
    ...employee,
    basicSalary: employee.basicSalary ? Number(employee.basicSalary) : 0,
    joinDate: employee.joinDate ? employee.joinDate.toISOString() : null,
    createdAt: employee.createdAt ? employee.createdAt.toISOString() : null,
    updatedAt: employee.updatedAt ? employee.updatedAt.toISOString() : null,
  };

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <EmployeeProfileClient employee={serializedEmployee} />
    </div>
  );
}
