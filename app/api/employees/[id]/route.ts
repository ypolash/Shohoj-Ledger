import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const data = await request.json();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedId = decodeURIComponent(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    
    let actualId = decodedId;
    if (!isUUID) {
      const searchName = decodedId.replace(/_/g, ' ').toLowerCase();
      const employees = await prisma.employee.findMany({
        where: { companyId },
        select: { id: true, firstName: true, lastName: true }
      });
      const matched = employees.find(e => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === searchName);
      if (!matched) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      actualId = matched.id;
    }

    // Validate ownership before update
    const existingEmp = await prisma.employee.findFirst({ where: { id: actualId, companyId } });
    if (!existingEmp) {
      return NextResponse.json({ error: "Employee not found or unauthorized" }, { status: 404 });
    }

    // Validate relational IDs if present
    if (data.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: data.departmentId, companyId } });
      if (!dept) return NextResponse.json({ error: 'Invalid department or cross-tenant reference' }, { status: 403 });
    }
    if (data.designationId) {
      const desig = await prisma.designation.findFirst({ where: { id: data.designationId, companyId } });
      if (!desig) return NextResponse.json({ error: 'Invalid designation or cross-tenant reference' }, { status: 403 });
    }
    if (data.reportingManagerId) {
      const mgr = await prisma.employee.findFirst({ where: { id: data.reportingManagerId, companyId } });
      if (!mgr) return NextResponse.json({ error: 'Invalid manager or cross-tenant reference' }, { status: 403 });
    }

    const employee = await prisma.employee.update({
      where: { id: actualId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        designation: data.designation,
        department: data.department,
        basicSalary: data.basicSalary,
        
        // New organization fields
        departmentId: data.departmentId || null,
        designationId: data.designationId || null,
        reportingManagerId: data.reportingManagerId || null,
        employmentType: data.employmentType || null,
        location: data.location || null,
        shift: data.shift || null,
        employmentStatus: data.employmentStatus || undefined,
      }
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error("Error updating employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const { id } = await context.params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedId = decodeURIComponent(id);
    const existingEmp = await prisma.employee.findFirst({
      where: {
        id: decodedId,
        companyId
      }
    });

    if (!existingEmp) {
      return NextResponse.json({ error: "Employee not found or unauthorized" }, { status: 404 });
    }

    const empId = existingEmp.id;

    await prisma.$transaction(async (tx) => {
      // 1. Unlink organizational leadership & management references
      await tx.department.updateMany({ where: { headOfDepartmentId: empId }, data: { headOfDepartmentId: null } });
      await tx.division.updateMany({ where: { headOfDivisionId: empId }, data: { headOfDivisionId: null } });
      await tx.section.updateMany({ where: { headOfSectionId: empId }, data: { headOfSectionId: null } });
      await tx.team.updateMany({ where: { leadOfTeamId: empId }, data: { leadOfTeamId: null } });
      await tx.warehouse.updateMany({ where: { managerId: empId }, data: { managerId: null } });
      await tx.project.updateMany({ where: { managerId: empId }, data: { managerId: null } });
      await tx.employee.updateMany({ where: { reportingManagerId: empId }, data: { reportingManagerId: null } });

      // 2. Unassign tasks, assets, leads, opportunities, sessions
      await tx.task.updateMany({ where: { assignedToEmployeeId: empId }, data: { assignedToEmployeeId: null } });
      await tx.taskReward.updateMany({ where: { assignedToEmployeeId: empId }, data: { assignedToEmployeeId: null } });
      await tx.asset.updateMany({ where: { assignedToEmployeeId: empId }, data: { assignedToEmployeeId: null } });
      await tx.lead.updateMany({ where: { assignedToId: empId }, data: { assignedToId: null } });
      await tx.opportunity.updateMany({ where: { ownerId: empId }, data: { ownerId: null } });
      await tx.trainingSession.updateMany({ where: { trainerId: empId }, data: { trainerId: null } });
      await tx.pickingTask.updateMany({ where: { assignedToId: empId }, data: { assignedToId: null } });
      await tx.packingTask.updateMany({ where: { packedById: empId }, data: { packedById: null } });
      await tx.putAwayTask.updateMany({ where: { assignedToId: empId }, data: { assignedToId: null } });
      await tx.stockTransfer.updateMany({ where: { approvedById: empId }, data: { approvedById: null } });
      await tx.stockTransfer.updateMany({ where: { requestedById: empId }, data: { requestedById: null } });
      await tx.cycleCount.updateMany({ where: { approvedById: empId }, data: { approvedById: null } });
      await tx.cycleCount.updateMany({ where: { createdById: empId }, data: { createdById: null } });
      await tx.inventoryAdjustment.updateMany({ where: { approvedById: empId }, data: { approvedById: null } });
      await tx.inventoryAdjustment.updateMany({ where: { createdById: empId }, data: { createdById: null } });
      await tx.payrollRun.updateMany({ where: { processedById: empId }, data: { processedById: null } });

      // 3. Clear reviews, feedback, and interviews
      await tx.performanceFeedback.deleteMany({ where: { authorId: empId } });
      await tx.performanceReview.deleteMany({ where: { reviewerId: empId } });
      await tx.performanceReview.deleteMany({ where: { employeeId: empId } });
      await tx.performanceGoal.deleteMany({ where: { employeeId: empId } });
      await tx.performanceImprovementPlan.deleteMany({ where: { employeeId: empId } });
      await tx.interviewFeedback.deleteMany({ where: { interviewerId: empId } });
      await tx.interview.deleteMany({ where: { interviewerId: empId } });
      await tx.trainingAssessment.deleteMany({ where: { assessorId: empId } });
      await tx.trainingEnrollment.deleteMany({ where: { traineeId: empId } });

      // 4. Clear task rewards, submissions, and payouts
      await tx.taskRewardSubmission.deleteMany({ where: { employeeId: empId } });
      await tx.taskRewardPayout.deleteMany({ where: { employeeId: empId } });

      // 5. Clear leave records & approvals
      await tx.leaveApproval.deleteMany({ where: { approvedById: empId } });
      await tx.leaveApproval.deleteMany({ where: { leaveRequest: { employeeId: empId } } });
      await tx.leaveRequest.deleteMany({ where: { employeeId: empId } });
      await tx.leaveBalance.deleteMany({ where: { employeeId: empId } });
      await tx.leaveAccrual.deleteMany({ where: { employeeId: empId } });
      await tx.leaveEncashment.deleteMany({ where: { employeeId: empId } });

      // 6. Clear attendance-related entries
      await tx.attendanceAdjustment.deleteMany({ where: { employeeId: empId } });
      await tx.attendanceOvertime.deleteMany({ where: { employeeId: empId } });
      await tx.attendanceRoster.deleteMany({ where: { employeeId: empId } });
      await tx.attendanceHolidayAssignment.deleteMany({ where: { employeeId: empId } });
      await tx.attendanceException.deleteMany({ where: { employeeId: empId } });
      await tx.attendanceShiftAssignment.deleteMany({ where: { employeeId: empId } });
      await tx.attendance.deleteMany({ where: { employeeId: empId } });

      // 7. Clear payroll, loans, salary and finance relations
      await tx.payrollApproval.deleteMany({ where: { approvedById: empId } });
      await tx.payrollItem.deleteMany({ where: { employeeId: empId } });
      await tx.payslip.deleteMany({ where: { employeeId: empId } });
      await tx.salaryAdvanceRecovery.deleteMany({ where: { salaryAdvance: { employeeId: empId } } });
      await tx.salaryAdvance.deleteMany({ where: { employeeId: empId } });
      await tx.salaryDeduction.deleteMany({ where: { employeeId: empId } });
      await tx.salaryPayment.deleteMany({ where: { employeeId: empId } });
      await tx.employeeLoanInstallment.deleteMany({ where: { loan: { employeeId: empId } } });
      await tx.employeeLoan.deleteMany({ where: { employeeId: empId } });
      await tx.employeeLoan.updateMany({ where: { approvedById: empId }, data: { approvedById: null } });
      await tx.bonus.deleteMany({ where: { employeeId: empId } });
      await tx.barcode.deleteMany({ where: { employeeId: empId } });
      await tx.stockMovement.deleteMany({ where: { employeeId: empId } });

      // 8. Clear profile, reporting, lifecycle, and documents
      await tx.employeeFine.deleteMany({ where: { employeeId: empId } });
      await tx.employeeSalary.deleteMany({ where: { employeeId: empId } });
      await tx.employeeLifecycle.deleteMany({ where: { employeeId: empId } });
      await tx.employeeExperience.deleteMany({ where: { employeeId: empId } });
      await tx.employeeEducation.deleteMany({ where: { employeeId: empId } });
      await tx.employeeDocument.deleteMany({ where: { employeeId: empId } });
      await tx.employeeAddress.deleteMany({ where: { employeeId: empId } });
      await tx.employeeEmergencyContact.deleteMany({ where: { employeeId: empId } });
      await tx.employeeReporting.deleteMany({ where: { employeeId: empId } });
      await tx.employeeReporting.deleteMany({ where: { managerId: empId } });
      await tx.projectEmployee.deleteMany({ where: { employeeId: empId } });
      await tx.employeeProfile.deleteMany({ where: { employeeId: empId } });

      // 9. Delete the employee record
      await tx.employee.delete({
        where: { id: empId }
      });

      // 10. Cleanup user login if exists
      if (existingEmp.userId) {
        await tx.user.delete({ where: { id: existingEmp.userId } }).catch(() => {});
      }
    });

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ error: error.message || "Failed to delete employee" }, { status: 500 });
  }
}

