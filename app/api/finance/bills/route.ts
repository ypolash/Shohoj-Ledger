import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export interface BillItem {
  id: string;
  billNumber: string;
  entityName: string;
  projectName?: string;
  projectId?: string;
  category: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'DUE_SOON' | 'OVERDUE' | 'UNPAID' | 'PAID' | 'PARTIAL';
  notes?: string;
  link?: string;
  talentType?: 'MODEL' | 'EDITOR';
  deliverableIds?: string[];
}

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("FINANCE_VIEW");
    if (rbacGuard) return rbacGuard;

    // 1. Fetch Projects for this company
    const projects: any = await (prisma.project as any).findMany({
      where: { companyId },
      include: {
        payments: { orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    const bills: BillItem[] = [];

    // Process Project Dues (Receivables and Talent Payables)
    projects.forEach((project: any) => {
      let baseBudget = Number(project.estimatedBudget || 0);
      const payments = (project.payments || []) as any[];
      const totalPaymentsReceived = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      // Parse Workflow Metadata
      let workflowMeta: any = null;
      if (project.description) {
        const match = project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
        if (match) {
          try {
            workflowMeta = JSON.parse(match[1]);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      // Revisions fee
      let revisionFees = 0;
      if (workflowMeta?.revisions && Array.isArray(workflowMeta.revisions)) {
        workflowMeta.revisions.forEach((r: any) => {
          if (r.fee && Number(r.fee) > 0) revisionFees += Number(r.fee);
        });
      }

      const effectiveBudget = baseBudget + revisionFees;
      const clientDue = Math.max(0, effectiveBudget - totalPaymentsReceived);

      // 1A. Project Client Due (RECEIVABLE by us - RED)
      if (clientDue > 0) {
        bills.push({
          id: `proj-client-${project.id}`,
          billNumber: project.projectCode || `PRJ-${project.id.slice(0, 6).toUpperCase()}`,
          entityName: project.clientName ? `${project.clientName}` : project.name,
          projectName: project.name,
          projectId: project.id,
          category: "Project Receivable",
          type: "RECEIVABLE",
          issueDate: project.createdAt ? new Date(project.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          dueDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          amount: effectiveBudget,
          paidAmount: totalPaymentsReceived,
          dueAmount: clientDue,
          status: totalPaymentsReceived > 0 ? "PARTIAL" : "UNPAID",
          notes: `Remaining client balance receivable for project "${project.name}"`,
          link: `/erp/projects/${project.id}`
        });
      }

      // 1B. Model Talent Settlement Due (PAYABLE to model - BLUE)
      if (workflowMeta?.productData) {
        const prod = workflowMeta.productData;
        const modelRate = parseFloat(String(prod.modelRate || 0)) || (prod.assignedModelName || prod.modelRequired ? 1000 : 0);
        if (modelRate > 0) {
          const modelPaidAmount = prod.modelPaidAmount !== undefined
            ? (parseFloat(String(prod.modelPaidAmount)) || 0)
            : (prod.modelPaid ? modelRate : 0);
          const modelDue = Math.max(0, modelRate - modelPaidAmount);

          if (modelDue > 0) {
            bills.push({
              id: `proj-model-${project.id}`,
              billNumber: `MODEL-${project.id.slice(0, 6).toUpperCase()}`,
              entityName: prod.assignedModelName || "Sarah Miller - Elite Agency",
              projectName: project.name,
              projectId: project.id,
              category: "Model Fee",
              type: "PAYABLE",
              issueDate: project.expectedShootingDate ? new Date(project.expectedShootingDate).toISOString().split("T")[0] : new Date(project.createdAt).toISOString().split("T")[0],
              dueDate: project.expectedShootingDate ? new Date(project.expectedShootingDate).toISOString().split("T")[0] : new Date(project.createdAt).toISOString().split("T")[0],
              amount: modelRate,
              paidAmount: modelPaidAmount,
              dueAmount: modelDue,
              status: modelPaidAmount > 0 ? "PARTIAL" : "UNPAID",
              notes: `Model talent settlement payable for project "${project.name}"`,
              link: `/erp/projects/${project.id}`,
              talentType: "MODEL"
            });
          }
        }
      }

      // 1C. Editor Deliverable Settlements Due (PAYABLE to editor - BLUE)
      let deliverables: any[] = [];
      if (Array.isArray(workflowMeta?.editingData?.videoDeliverables) && workflowMeta.editingData.videoDeliverables.length > 0) {
        deliverables = workflowMeta.editingData.videoDeliverables;
      } else if (Array.isArray(workflowMeta?.videoDeliverables) && workflowMeta.videoDeliverables.length > 0) {
        deliverables = workflowMeta.videoDeliverables;
      } else if (Array.isArray(workflowMeta?.shootingData?.videoDeliverables) && workflowMeta.shootingData.videoDeliverables.length > 0) {
        deliverables = workflowMeta.shootingData.videoDeliverables;
      } else if (workflowMeta?.shootingData?.assignedEditorName || workflowMeta?.editingData) {
        const sData = workflowMeta?.shootingData || {};
        deliverables = [{
          id: 'vid-1',
          title: 'Video 1: Master Commercial Cut',
          assignedEditorName: sData.assignedEditorName || 'Tannu',
          editorFee: sData.editorFee || 1000,
          editorPaid: Boolean(sData.editorPaid),
          editorPaidAmount: sData.editorPaidAmount || 0
        }];
      }

      if (deliverables.length > 0) {
        const editorMap: Record<string, { name: string; totalFee: number; totalPaid: number; videoTitles: string[]; deliverableIds: string[] }> = {};

        deliverables.forEach((v: any) => {
          const editorName = (v.assignedEditorName || "").trim() || "Tannu";
          const fee = parseFloat(String(v.editorFee || 0)) || 1000;
          const paidAmt = v.editorPaidAmount !== undefined
            ? (parseFloat(String(v.editorPaidAmount)) || 0)
            : (v.editorPaid ? fee : 0);

          if (!editorMap[editorName]) {
            editorMap[editorName] = { name: editorName, totalFee: 0, totalPaid: 0, videoTitles: [], deliverableIds: [] };
          }
          editorMap[editorName].totalFee += fee;
          editorMap[editorName].totalPaid += paidAmt;
          if (v.title) editorMap[editorName].videoTitles.push(v.title);
          if (v.id) editorMap[editorName].deliverableIds.push(v.id);
        });

        Object.entries(editorMap).forEach(([eName, summary]) => {
          const editorDue = Math.max(0, summary.totalFee - summary.totalPaid);
          if (editorDue > 0) {
            bills.push({
              id: `proj-editor-${project.id}-${encodeURIComponent(eName)}`,
              billNumber: `EDIT-${project.id.slice(0, 6).toUpperCase()}`,
              entityName: `Editor Settlement: ${summary.name}`,
              projectName: project.name,
              projectId: project.id,
              category: "Editor Fee",
              type: "PAYABLE",
              issueDate: project.expectedEditingDate ? new Date(project.expectedEditingDate).toISOString().split("T")[0] : new Date(project.createdAt).toISOString().split("T")[0],
              dueDate: project.expectedEditingDate ? new Date(project.expectedEditingDate).toISOString().split("T")[0] : new Date(project.createdAt).toISOString().split("T")[0],
              amount: summary.totalFee,
              paidAmount: summary.totalPaid,
              dueAmount: editorDue,
              status: summary.totalPaid > 0 ? "PARTIAL" : "UNPAID",
              notes: `Assigned to: ${summary.videoTitles.join(', ')} for project "${project.name}"`,
              link: `/erp/projects/${project.id}`,
              talentType: "EDITOR",
              deliverableIds: summary.deliverableIds
            });
          }
        });
      }
    });

    // 2. Fetch Non-Project Incomes with Dues (RECEIVABLE by us - RED)
    const incomes = await prisma.income.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });

    incomes.forEach((inc: any) => {
      const total = Number(inc.amount || 0);
      const received = Number(inc.received || 0);
      const due = Math.max(0, total - received);

      // Only include if due > 0 and not already covered by a project
      if (due > 0 && !inc.projectId) {
        bills.push({
          id: `inc-${inc.id}`,
          billNumber: `INC-${inc.id.slice(0, 8).toUpperCase()}`,
          entityName: inc.source || inc.description || "General Client",
          category: inc.category || "General Income",
          type: "RECEIVABLE",
          issueDate: new Date(inc.createdAt).toISOString().split("T")[0],
          dueDate: new Date(inc.createdAt).toISOString().split("T")[0],
          amount: total,
          paidAmount: received,
          dueAmount: due,
          status: received > 0 ? "PARTIAL" : "UNPAID",
          notes: inc.description || "Income balance receivable",
          link: `/erp/finance/income/${inc.id}`
        });
      }
    });

    // 3. Fetch Pending Expenses / Vendor Bills (PAYABLE by us - BLUE)
    const pendingExpenses = await prisma.expense.findMany({
      where: { companyId, approvalStatus: { in: ["PENDING", "UNPAID"] } },
      orderBy: { createdAt: "desc" }
    });

    pendingExpenses.forEach((exp: any) => {
      const amount = Number(exp.amount || 0);
      if (amount > 0) {
        bills.push({
          id: `exp-${exp.id}`,
          billNumber: `EXP-${exp.id.slice(0, 8).toUpperCase()}`,
          entityName: exp.description || exp.category || "Vendor / Supplier",
          category: exp.category || "Vendor Bill",
          type: "PAYABLE",
          issueDate: new Date(exp.createdAt).toISOString().split("T")[0],
          dueDate: new Date(exp.createdAt).toISOString().split("T")[0],
          amount: amount,
          paidAmount: 0,
          dueAmount: amount,
          status: "UNPAID",
          notes: exp.description || "Vendor expense pending payment"
        });
      }
    });

    // Sort by Due Amount / Date descending
    bills.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    // Compute Summary KPIs
    let totalPayableDue = 0;
    let totalReceivableDue = 0;
    let payableCount = 0;
    let receivableCount = 0;

    bills.forEach((b) => {
      if (b.type === "PAYABLE") {
        totalPayableDue += b.dueAmount;
        payableCount++;
      } else {
        totalReceivableDue += b.dueAmount;
        receivableCount++;
      }
    });

    return NextResponse.json({
      bills,
      kpis: {
        totalPayableDue,
        totalReceivableDue,
        totalDue: totalPayableDue + totalReceivableDue,
        payableCount,
        receivableCount,
        totalCount: bills.length
      }
    });
  } catch (error) {
    console.error("GET Finance Bills Error:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("FINANCE_MANAGE");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { vendorName, category = "General Expense", amount, dueDate, notes } = body;
    const numAmount = parseFloat(amount);

    if (!vendorName || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Valid vendor name and amount are required" }, { status: 400 });
    }

    const description = notes ? `${vendorName}: ${notes}` : `${vendorName} - Vendor Bill`;

    const expense = await prisma.expense.create({
      data: {
        companyId,
        category: category || "Vendor Bill",
        amount: numAmount,
        paymentMethod: "Pending Disbursement",
        approvalStatus: "PENDING",
        description,
        systemSource: "ERP"
      }
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    console.error("POST Finance Bill Error:", error);
    return NextResponse.json({ error: "Failed to create vendor bill" }, { status: 500 });
  }
}
