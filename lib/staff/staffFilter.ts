/**
 * Centralized, authoritative filter to permanently separate regular Staff
 * from Freelancers and Model Talents.
 *
 * Freelancers and Models have their own dedicated operational sections
 * (/erp/hr/freelance and /erp/hr/models) and must NEVER mix with regular
 * office staff in:
 * - Employee directories & rosters
 * - Daily duty rosters & shifts
 * - Attendance logging & absence tracking
 * - Disciplinary fines & penalty evaluations
 * - Monthly payroll runs & payslips
 * - Leave management
 * - HR headcount & workforce analytics
 */

export interface EmployeeLike {
  id?: string;
  employeeId?: string | null;
  employmentType?: string | null;
  department?: string | null;
  designation?: string | null;
  departmentRef?: { name?: string | null } | null;
  designationRef?: { name?: string | null } | null;
  location?: string | null;
  email?: string | null;
}

const FREELANCE_MODEL_PREFIXES = ['FL-', 'MDL-'];

const FREELANCE_MODEL_TYPES = [
  'freelance',
  'freelancer',
  'contractor',
  'project-based',
  'model',
  'talent',
];

const FREELANCE_MODEL_DEPTS = [
  'freelance',
  'creative freelance',
  'post-production',
  'video editing',
  'model talent',
  'fashion',
  'modeling agency',
  'talent',
  'independent / freelance',
  'independent talent',
];

/**
 * Returns true if the entity is a Freelancer or a Model Talent.
 * Returns false if the entity is regular permanent / salaried staff.
 */
export function isFreelancerOrModel(emp?: EmployeeLike | null): boolean {
  if (!emp) return false;

  // 1. Employee ID prefix (e.g. FL-123456, MDL-123456)
  const empId = (emp.employeeId || '').toUpperCase().trim();
  for (const prefix of FREELANCE_MODEL_PREFIXES) {
    if (empId.startsWith(prefix)) return true;
  }

  // 2. Employment Type check
  const empType = (emp.employmentType || '').toLowerCase().trim();
  if (empType && FREELANCE_MODEL_TYPES.includes(empType)) {
    return true;
  }

  // 3. Location metadata (Freelancers store JSON with type: "FREELANCER" in location)
  const loc = typeof emp.location === 'string' ? emp.location.toUpperCase() : '';
  if (loc.includes('FREELANCER') || loc.includes('MODEL_TALENT') || loc.includes('"TYPE":"FREELANCER"') || loc.includes('"TYPE":"MODEL"')) {
    return true;
  }

  // 4. Email convention (e.g. freelance.xxx@shohoj.local, model.xxx@shohoj.local)
  const email = (emp.email || '').toLowerCase().trim();
  if (email.startsWith('freelance.') || email.startsWith('model.')) {
    return true;
  }

  // 5. Department check
  const dept = (emp.departmentRef?.name || emp.department || '').toLowerCase().trim();
  if (dept && FREELANCE_MODEL_DEPTS.includes(dept)) {
    return true;
  }

  // 6. Designation check
  const desig = (emp.designationRef?.name || emp.designation || '').toLowerCase().trim();
  if (
    desig === 'model' ||
    desig.startsWith('freelance') ||
    desig.includes('freelance ') ||
    desig.includes('freelancer') ||
    desig.includes('contractor') ||
    desig.includes('catalog model') ||
    desig.includes('fashion model') ||
    desig.includes('commercial model')
  ) {
    return true;
  }

  return false;
}

/**
 * Convenience helper: returns true if the entity is a verified regular staff member.
 */
export function isRegularStaff(emp?: EmployeeLike | null): boolean {
  return !isFreelancerOrModel(emp);
}

/**
 * Prisma query condition to strictly exclude Freelancers and Models from DB queries.
 * Spread this into where: { ...companyFilter, ...STAFF_PRISMA_EXCLUDE }
 */
export const STAFF_PRISMA_EXCLUDE = {
  NOT: [
    { employeeId: { startsWith: 'FL-' } },
    { employeeId: { startsWith: 'MDL-' } },
    { employeeId: { startsWith: 'fl-' } },
    { employeeId: { startsWith: 'mdl-' } },
    {
      employmentType: {
        in: [
          'Freelance',
          'freelance',
          'Freelancer',
          'freelancer',
          'Contractor',
          'contractor',
          'Project-Based',
          'project-based',
          'Model',
          'model',
          'Talent',
          'talent',
        ]
      }
    },
    {
      department: {
        in: [
          'Freelance',
          'freelance',
          'Creative Freelance',
          'creative freelance',
          'Post-Production',
          'post-production',
          'Video Editing',
          'video editing',
          'Model Talent',
          'model talent',
          'Fashion',
          'fashion',
          'Modeling Agency',
          'modeling agency',
          'Talent',
          'talent',
          'Independent / Freelance',
          'Independent Talent',
        ]
      }
    },
    { designation: { contains: 'Freelance', mode: 'insensitive' as const } },
    { designation: { contains: 'Freelancer', mode: 'insensitive' as const } },
    { designation: { contains: 'Contractor', mode: 'insensitive' as const } },
    { designation: { contains: 'Model', mode: 'insensitive' as const } },
    { location: { contains: 'FREELANCER' } },
    { location: { contains: 'MODEL_TALENT' } },
  ]
};
