/**
 * Platform-wide permission definitions.
 * 
 * moduleKey maps permissions to the overarching module.
 */
export const DefaultPermissions = [
  { action: "EMPLOYEE_VIEW", moduleKey: "HR" },
  { action: "EMPLOYEE_CREATE", moduleKey: "HR" },
  { action: "EMPLOYEE_EDIT", moduleKey: "HR" },
  { action: "EMPLOYEE_DELETE", moduleKey: "HR" },

  { action: "ATTENDANCE_VIEW", moduleKey: "ATTENDANCE" },
  { action: "ATTENDANCE_MANAGE", moduleKey: "ATTENDANCE" },

  { action: "PAYROLL_VIEW", moduleKey: "PAYROLL" },
  { action: "PAYROLL_MANAGE", moduleKey: "PAYROLL" },

  { action: "CRM_VIEW", moduleKey: "CRM" },
  { action: "CRM_MANAGE", moduleKey: "CRM" },

  { action: "LEAD_VIEW", moduleKey: "LEAD_MANAGEMENT" },
  { action: "LEAD_MANAGE", moduleKey: "LEAD_MANAGEMENT" },

  { action: "PROJECT_VIEW", moduleKey: "PROJECTS" },
  { action: "PROJECT_MANAGE", moduleKey: "PROJECTS" },

  { action: "FINANCE_VIEW", moduleKey: "ACCOUNTING" },
  { action: "FINANCE_MANAGE", moduleKey: "ACCOUNTING" },

  { action: "COMPANY_SETTINGS", moduleKey: "CORE" },
  { action: "MODULE_MANAGE", moduleKey: "CORE" },
  { action: "ROLE_MANAGE", moduleKey: "CORE" },
  { action: "USER_MANAGE", moduleKey: "CORE" },
];
