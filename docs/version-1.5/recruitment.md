# Version 1.5 - Enterprise Recruitment & Applicant Tracking System

## 1. Architecture
The Enterprise Recruitment module operates strictly outside the boundary of the `Employee` master. This structural isolation guarantees that applicants, rejected candidates, and withdrawing candidates never pollute the core employee database or leak into legacy Account/Payroll modules until they are explicitly hired.

**Core Models:**
- `JobOpening`: Ties to `Department`, `Designation`, and `EmploymentType`.
- `Applicant`: Independent entity mapped by `companyId`.
- `Application`: Pivot tracking a specific applicant to a specific opening.
- `Interview` & `InterviewFeedback`: Workflow stages linked to `Employee` evaluators.
- `JobOffer`: The financial and positional contract offered to an applicant.

## 2. ATS Workflow
The standard recruitment workflow progresses through the `Application` stages:
`APPLIED` ➔ `SCREENING` ➔ `SHORTLISTED` ➔ `INTERVIEW` ➔ `TECHNICAL` / `HR` ➔ `OFFERED` ➔ `HIRED` (or `REJECTED` / `WITHDRAWN` at any point).
Each state transition is tightly governed by the service layer to prevent skipping critical data entry (e.g., cannot move to `OFFERED` without creating a `JobOffer`).

## 3. Hiring Workflow & Employee Conversion
The climax of the ATS workflow is the `hireApplicant()` method.
This method is explicitly designed **NOT** to contain its own SQL insert statements for creating employees.
Instead, upon a successful `ACCEPTED` job offer:
1. It parses the `Applicant` and `JobOffer` details.
2. Formats a payload bridging the data gaps.
3. Invokes the core `createEmployee()` method from `lib/hr/employeeService.ts`.
This ensures that any future additions to Employee creation logic (e.g., generating Payroll accounts or assigning RBAC roles) apply universally and are never duplicated.

## 4. Security & RBAC
- **Strict Isolation:** All queries explicitly mandate `{ companyId }` verification.
- **Role Permissions Added:** `RECRUITMENT_VIEW`, `RECRUITMENT_CREATE`, `RECRUITMENT_UPDATE`, `RECRUITMENT_HIRE`.
- **Hiring Permissions:** Only members with `RECRUITMENT_HIRE` (or equivalent SuperAdmin roles) can execute the `hireApplicant()` workflow, mitigating unauthorized employee insertions.

## 5. Audit
- **Application Tracking:** All stage changes are logged inherently by the `updatedAt` timestamps and stage enums.
- **Interview Accountability:** `InterviewFeedback` securely binds the technical evaluation to the `interviewerId` (an existing Employee/Manager).
- **Offer Transparency:** Job Offers permanently record the baseline salary and terms agreed upon, which acts as the legal precedent prior to Employee conversion.
