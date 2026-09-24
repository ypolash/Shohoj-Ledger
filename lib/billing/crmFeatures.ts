export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: "CRM" | "ERP_MODULE";
  icon: string;
  href?: string;
  badge?: string;
}

export const CRM_FEATURES: FeatureDefinition[] = [
  {
    key: "crm_dashboard",
    name: "CRM Dashboard & Metrics",
    description: "Overview of sales metrics, KPI totals, recent lead trends and activity timeline.",
    category: "CRM",
    icon: "dashboard",
    href: "/erp/crm",
  },
  {
    key: "crm_customers",
    name: "Customer Management",
    description: "Manage client accounts, contact profiles, customer groups and relationship history.",
    category: "CRM",
    icon: "person_search",
    href: "/erp/crm/customers",
  },
  {
    key: "crm_leads",
    name: "Leads & Kanban Pipeline",
    description: "Track prospective leads, pipeline stages, status changes, and lead qualification.",
    category: "CRM",
    icon: "view_kanban",
    href: "/erp/crm/leads",
  },
  {
    key: "crm_opportunities",
    name: "Deals & Opportunities",
    description: "Pipeline forecasting, probability tracking, win/loss analysis and deal stages.",
    category: "CRM",
    icon: "trending_up",
    href: "/erp/crm/opportunities",
  },
  {
    key: "crm_quotations",
    name: "Quotations & Price Proposals",
    description: "Create professional sales quotes, price estimates, client approvals and PDF export.",
    category: "CRM",
    icon: "request_quote",
    href: "/erp/crm/quotations",
  },
  {
    key: "crm_sales_orders",
    name: "Sales Orders & Fulfillment",
    description: "Process confirmed sales orders, fulfillment tracking, and invoice generation.",
    category: "CRM",
    icon: "shopping_cart",
    href: "/erp/crm/sales-orders",
  },
  {
    key: "crm_follow_ups",
    name: "Follow-Ups & Appointments",
    description: "Schedule, track, and manage customer follow-ups and appointment bookings.",
    category: "CRM",
    icon: "event_upcoming",
    href: "/erp/crm/follow-ups",
  },
  {
    key: "crm_reports",
    name: "CRM Analytics & Reports",
    description: "Detailed sales rep performance reports, activity calendar, and conversion rate analytics.",
    category: "CRM",
    icon: "analytics",
    href: "/erp/crm/reports",
  },
];

export const ERP_SYSTEM_MODULES: FeatureDefinition[] = [
  {
    key: "mod_finance",
    name: "Finance & Accounting",
    description: "General ledger entries, charts of accounts, financial reports and audit trails.",
    category: "ERP_MODULE",
    icon: "payments",
    href: "/erp/finance",
  },
  {
    key: "mod_inventory",
    name: "Inventory & Warehouses",
    description: "Stock transactions, warehouse tracking, supplier purchase orders and alerts.",
    category: "ERP_MODULE",
    icon: "inventory_2",
    href: "/erp/inventory",
  },
  {
    key: "mod_hr_payroll",
    name: "HR & Payroll",
    description: "Employee records, attendance, shifts, leave requests and automated payroll.",
    category: "ERP_MODULE",
    icon: "badge",
    href: "/erp/hr",
  },
  {
    key: "mod_projects",
    name: "Project Management",
    description: "Project timelines, milestone management, task assignments and tracking.",
    category: "ERP_MODULE",
    icon: "folder",
    href: "/erp/projects",
  },
  {
    key: "mod_marketing",
    name: "Marketing Campaigns",
    description: "Campaign tracking, ad channels, audience insights and ROI performance.",
    category: "ERP_MODULE",
    icon: "campaign",
    href: "/erp/marketing",
  },
];

export const ALL_AVAILABLE_FEATURES: FeatureDefinition[] = [
  ...CRM_FEATURES,
  ...ERP_SYSTEM_MODULES,
];

// Presets for fast selection
export const FEATURE_PRESETS = {
  FULL_CRM: {
    name: "Full CRM Suite",
    description: "Includes all 7 CRM features (Dashboard, Customers, Leads, Opportunities, Quotes, Orders, Reports).",
    keys: CRM_FEATURES.map((f) => f.key),
  },
  BASIC_CRM: {
    name: "Basic CRM",
    description: "Core CRM essentials: Dashboard, Customers, and Leads.",
    keys: ["crm_dashboard", "crm_customers", "crm_leads"],
  },
  SALES_PIPELINE: {
    name: "Sales Pipeline",
    description: "Complete sales flow: Dashboard, Customers, Leads, Opportunities, and Quotations.",
    keys: ["crm_dashboard", "crm_customers", "crm_leads", "crm_opportunities", "crm_quotations"],
  },
  ALL_INCLUSIVE: {
    name: "Enterprise All-Inclusive",
    description: "Every single CRM feature and all ERP modules included.",
    keys: ALL_AVAILABLE_FEATURES.map((f) => f.key),
  },
};

/**
 * Returns a FeatureDefinition by its key
 */
export function getFeatureByKey(key: string): FeatureDefinition | undefined {
  return ALL_AVAILABLE_FEATURES.find((f) => f.key === key);
}

/**
 * Checks if a specific feature key is included in a plan's feature list.
 * If the plan has "all" or "ALL_FEATURES" or contains the specific key, returns true.
 */
export function isFeatureIncludedInPlan(planFeatures: string[] | undefined | null, featureKey: string): boolean {
  if (!planFeatures || !Array.isArray(planFeatures)) return false;
  if (planFeatures.includes("*") || planFeatures.includes("ALL_FEATURES") || planFeatures.includes("All Modules")) {
    return true;
  }
  return planFeatures.includes(featureKey);
}

/**
 * Maps feature keys to human-friendly badge tags
 */
export function getFeatureDisplayNames(features: string[] | undefined | null): string[] {
  if (!features || !Array.isArray(features)) return [];
  return features.map((k) => {
    const found = getFeatureByKey(k);
    return found ? found.name : k;
  });
}
