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
  { action: "ACCOUNT_VIEW", moduleKey: "ACCOUNTING" },
  { action: "ACCOUNT_CREATE", moduleKey: "ACCOUNTING" },
  { action: "ACCOUNT_EDIT", moduleKey: "ACCOUNTING" },
  { action: "ACCOUNT_DELETE", moduleKey: "ACCOUNTING" },
  { action: "JOURNAL_VIEW", moduleKey: "ACCOUNTING" },
  { action: "JOURNAL_MANAGE", moduleKey: "ACCOUNTING" },
  { action: "FISCALYEAR_MANAGE", moduleKey: "ACCOUNTING" },
  { action: "JOURNALENTRY_VIEW", moduleKey: "ACCOUNTING" },
  { action: "JOURNALENTRY_CREATE", moduleKey: "ACCOUNTING" },
  { action: "JOURNALENTRY_EDIT", moduleKey: "ACCOUNTING" },
  { action: "JOURNALENTRY_POST", moduleKey: "ACCOUNTING" },
  { action: "JOURNALENTRY_VOID", moduleKey: "ACCOUNTING" },
  { action: "LEDGER_VIEW", moduleKey: "ACCOUNTING" },
  { action: "LEDGER_EXPORT", moduleKey: "ACCOUNTING" },
  { action: "LEDGER_AUDIT", moduleKey: "ACCOUNTING" },
  { action: "TRIALBALANCE_VIEW", moduleKey: "ACCOUNTING" },
  { action: "TRIALBALANCE_EXPORT", moduleKey: "ACCOUNTING" },
  { action: "PROFITLOSS_VIEW", moduleKey: "ACCOUNTING" },
  { action: "PROFITLOSS_EXPORT", moduleKey: "ACCOUNTING" },
  { action: "CASHFLOW_VIEW", moduleKey: "ACCOUNTING" },
  { action: "CASHFLOW_EXPORT", moduleKey: "ACCOUNTING" },
  { action: "BALANCESHEET_VIEW", moduleKey: "ACCOUNTING" },
  { action: "BALANCESHEET_EXPORT", moduleKey: "ACCOUNTING" },

  { action: "COMPANY_SETTINGS", moduleKey: "CORE" },
  { action: "MODULE_MANAGE", moduleKey: "CORE" },
  { action: "ROLE_MANAGE", moduleKey: "CORE" },
  { action: "USER_MANAGE", moduleKey: "CORE" },

  { action: "WORKFLOW_VIEW", moduleKey: "WORKFLOW" },
  { action: "WORKFLOW_CREATE", moduleKey: "WORKFLOW" },
  { action: "WORKFLOW_UPDATE", moduleKey: "WORKFLOW" },
  { action: "WORKFLOW_DELETE", moduleKey: "WORKFLOW" },
  { action: "WORKFLOW_EXECUTE", moduleKey: "WORKFLOW" },

  { action: "APPROVAL_VIEW", moduleKey: "APPROVAL" },
  { action: "APPROVAL_CREATE", moduleKey: "APPROVAL" },
  { action: "APPROVAL_UPDATE", moduleKey: "APPROVAL" },
  { action: "APPROVAL_APPROVE", moduleKey: "APPROVAL" },
  { action: "APPROVAL_REJECT", moduleKey: "APPROVAL" },

  { action: "REPORT_VIEW", moduleKey: "REPORTING" },
  { action: "REPORT_CREATE", moduleKey: "REPORTING" },
  { action: "REPORT_UPDATE", moduleKey: "REPORTING" },
  { action: "REPORT_DELETE", moduleKey: "REPORTING" },
  { action: "REPORT_EXPORT", moduleKey: "REPORTING" },
  { action: "REPORT_EXPORT", moduleKey: "REPORTING" },
  { action: "REPORT_MANAGE", moduleKey: "REPORTING" },

  { action: "NOTIFICATION_VIEW", moduleKey: "NOTIFICATIONS" },
  { action: "NOTIFICATION_CREATE", moduleKey: "NOTIFICATIONS" },
  { action: "NOTIFICATION_UPDATE", moduleKey: "NOTIFICATIONS" },
  { action: "NOTIFICATION_UPDATE", moduleKey: "NOTIFICATIONS" },
  { action: "NOTIFICATION_MANAGE", moduleKey: "NOTIFICATIONS" },

  { action: "API_KEY_VIEW", moduleKey: "API_PLATFORM" },
  { action: "API_KEY_CREATE", moduleKey: "API_PLATFORM" },
  { action: "API_KEY_DELETE", moduleKey: "API_PLATFORM" },
  { action: "WEBHOOK_VIEW", moduleKey: "API_PLATFORM" },
  { action: "WEBHOOK_CREATE", moduleKey: "API_PLATFORM" },
  { action: "WEBHOOK_MANAGE", moduleKey: "API_PLATFORM" },

  { action: "BRANCH_VIEW", moduleKey: "BRANCH" },
  { action: "BRANCH_CREATE", moduleKey: "BRANCH" },
  { action: "BRANCH_UPDATE", moduleKey: "BRANCH" },
  { action: "BRANCH_DELETE", moduleKey: "BRANCH" },
  { action: "BRANCH_MANAGE_USERS", moduleKey: "BRANCH" },

  { action: "INVENTORY_VIEW", moduleKey: "INVENTORY" },
  { action: "INVENTORY_CREATE", moduleKey: "INVENTORY" },
  { action: "INVENTORY_UPDATE", moduleKey: "INVENTORY" },
  { action: "WAREHOUSE_MANAGE", moduleKey: "INVENTORY" },
  { action: "SUPPLIER_MANAGE", moduleKey: "INVENTORY" },
  { action: "PURCHASE_MANAGE", moduleKey: "INVENTORY" },

  { action: "ANALYTICS_VIEW", moduleKey: "ANALYTICS" },
  { action: "ANALYTICS_MANAGE", moduleKey: "ANALYTICS" },
  { action: "INSIGHT_VIEW", moduleKey: "ANALYTICS" },
  { action: "INSIGHT_MANAGE", moduleKey: "ANALYTICS" },
  { action: "FORECAST_VIEW", moduleKey: "ANALYTICS" },
];
