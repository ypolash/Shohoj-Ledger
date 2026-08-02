const fs = require('fs');
const execSync = require('child_process').execSync;

execSync('mkdir -p components/settlement components/payroll components/employees');
execSync('cp app/erp/settlement/page.tsx components/settlement/SettlementPageClient.tsx');
execSync('cp app/erp/staff-management/payroll/page.tsx components/payroll/PayrollPageClient.tsx');
execSync('cp app/erp/staff-management/employees/page.tsx components/employees/EmployeesPageClient.tsx');

// 1. Settlement (622 lines) -> Target: < 600
let sLines = fs.readFileSync('components/settlement/SettlementPageClient.tsx', 'utf8').split('\n');
let sModalLines = sLines.slice(374, 466);
fs.writeFileSync('components/settlement/SettlementFormModal.tsx', `import React from 'react';\nimport styles from "@/app/income/page.module.css";\nexport function SettlementFormModal(props: any) { const { isModalOpen, setIsModalOpen, newSettlement, handleInputChange, handleAddSettlement } = props; return <>\n${sModalLines.join('\n')}\n</>; }\n`);
let newSLines = [...sLines.slice(0, 374), `      <SettlementFormModal {...{ isModalOpen, setIsModalOpen, newSettlement, handleInputChange, handleAddSettlement }} />`, ...sLines.slice(466)];
newSLines[0] = `"use client";\nimport { SettlementFormModal } from "./SettlementFormModal";\n` + newSLines[0].replace('"use client";', '');
fs.writeFileSync('components/settlement/SettlementPageClient.tsx', newSLines.join('\n').replace('export default function SettlementPage', 'export default function SettlementPageClient'));

// 2. Payroll (629 lines) -> Target: < 600
let pLines = fs.readFileSync('components/payroll/PayrollPageClient.tsx', 'utf8').split('\n');
let pModalLines = pLines.slice(575, 625);
fs.writeFileSync('components/payroll/PayrollHistoryModal.tsx', `import React from 'react';\nimport styles from "@/app/erp/staff-management/page.module.css";\nexport function PayrollHistoryModal(props: any) { const { isHistoryModalOpen, setIsHistoryModalOpen, loadingAudits, auditLogs } = props; return <>\n${pModalLines.join('\n')}\n</>; }\n`);
let newPLines = [...pLines.slice(0, 575), `      <PayrollHistoryModal {...{ isHistoryModalOpen, setIsHistoryModalOpen, loadingAudits, auditLogs }} />`, ...pLines.slice(625)];
newPLines[0] = `"use client";\nimport { PayrollHistoryModal } from "./PayrollHistoryModal";\n` + newPLines[0].replace('"use client";', '');
fs.writeFileSync('components/payroll/PayrollPageClient.tsx', newPLines.join('\n').replace('export default function PayrollManagementPage', 'export default function PayrollPageClient').replace('import styles from "../../income/page.module.css";', 'import styles from "@/app/erp/staff-management/page.module.css";'));

// 3. Employees (656 lines) -> Target: < 600
let eLines = fs.readFileSync('components/employees/EmployeesPageClient.tsx', 'utf8').split('\n');
let eModalLines = eLines.slice(538, 648);
fs.writeFileSync('components/employees/EmployeeDetailsDrawer.tsx', `import React from 'react';\nimport styles from "@/app/erp/staff-management/page.module.css";\nexport function EmployeeDetailsDrawer(props: any) { const { selectedEmployee, setSelectedEmployee, openEditModal, formatCurrency, getAvatarInitials, getStatusBadgeClass, getRoleBadgeClass } = props; return <>\n${eModalLines.join('\n')}\n</>; }\n`);
let newELines = [...eLines.slice(0, 538), `      <EmployeeDetailsDrawer {...{ selectedEmployee, setSelectedEmployee, openEditModal, formatCurrency, getAvatarInitials, getStatusBadgeClass, getRoleBadgeClass }} />`, ...eLines.slice(648)];
newELines[0] = `"use client";\nimport { EmployeeDetailsDrawer } from "./EmployeeDetailsDrawer";\n` + newELines[0].replace('"use client";', '');
fs.writeFileSync('components/employees/EmployeesPageClient.tsx', newELines.join('\n').replace('export default function EmployeesPage', 'export default function EmployeesPageClient').replace('import styles from "../page.module.css";', 'import styles from "@/app/erp/staff-management/page.module.css";'));

// 4. Update the real pages
function replacePage(filePath, componentPath, componentName) {
  fs.writeFileSync(filePath, `"use client";\nimport ${componentName} from "${componentPath}";\nexport default function Page() { return <${componentName} />; }\n`);
}
replacePage('app/erp/settlement/page.tsx', '@/components/settlement/SettlementPageClient', 'SettlementPageClient');
replacePage('app/dashboard/settlement/page.tsx', '@/components/settlement/SettlementPageClient', 'SettlementPageClient');
replacePage('app/erp/staff-management/payroll/page.tsx', '@/components/payroll/PayrollPageClient', 'PayrollPageClient');
replacePage('app/dashboard/staff-management/payroll/page.tsx', '@/components/payroll/PayrollPageClient', 'PayrollPageClient');
replacePage('app/erp/staff-management/employees/page.tsx', '@/components/employees/EmployeesPageClient', 'EmployeesPageClient');
replacePage('app/dashboard/staff-management/employees/page.tsx', '@/components/employees/EmployeesPageClient', 'EmployeesPageClient');

console.log('Precise extraction complete.');
