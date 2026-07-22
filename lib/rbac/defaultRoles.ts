import { DefaultPermissions } from "./defaultPermissions";

/**
 * Defines which permissions belong to which default roles.
 * A single company receives all these roles upon creation.
 */
export const DefaultRoleMappings: Record<string, string[]> = {
  "Owner": DefaultPermissions.map(p => p.action), // Full access
  
  "Admin": [
    ...DefaultPermissions.map(p => p.action).filter(a => a !== "MODULE_MANAGE") // Almost full access
  ],

  "HR": [
    "EMPLOYEE_VIEW",
    "EMPLOYEE_CREATE",
    "EMPLOYEE_EDIT",
    "EMPLOYEE_DELETE",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_MANAGE",
    "PAYROLL_VIEW",
    "PAYROLL_MANAGE"
  ],

  "Accountant": [
    "FINANCE_VIEW",
    "FINANCE_MANAGE",
    "PAYROLL_VIEW"
  ],

  "Manager": [
    "EMPLOYEE_VIEW",
    "PROJECT_VIEW",
    "PROJECT_MANAGE",
    "ATTENDANCE_VIEW"
  ],

  "Employee": [
    // Standard access requires fewer explicit global permissions.
    "EMPLOYEE_VIEW",
    "ATTENDANCE_VIEW",
    "PROJECT_VIEW"
  ]
};
