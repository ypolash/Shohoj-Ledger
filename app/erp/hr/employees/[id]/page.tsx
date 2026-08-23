import React from 'react';
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import EmployeeProfileClient from "./EmployeeProfileClient";

export default async function EmployeeProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const decodedId = decodeURIComponent(params.id);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
  
  let employee = null;
  
  if (isUUID) {
    employee = await prisma.employee.findFirst({
      where: {
        id: decodedId,
        companyId: session.user.companyId,
      },
    });
  } else {
    const searchName = decodedId.replace(/_/g, ' ').toLowerCase();
    const employees = await prisma.employee.findMany({
      where: { companyId: session.user.companyId },
      select: { id: true, firstName: true, lastName: true }
    });
    
    const matched = employees.find(e => 
      `${e.firstName} ${e.lastName}`.trim().toLowerCase() === searchName
    );
    
    if (matched) {
      employee = await prisma.employee.findFirst({
        where: { id: matched.id }
      });
    }
  }

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
