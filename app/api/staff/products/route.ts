import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId");
    const statusFilter = url.searchParams.get("status"); // 'ALL' | 'RECEIVED' | 'PENDING_RETURN' | 'RETURNED'
    const search = url.searchParams.get("search") || "";

    // Fetch all active or completed projects that have workflow state
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        projectCode: true,
        clientName: true,
        clientPhone: true,
        status: true,
        progress: true,
        startDate: true,
        endDate: true,
        description: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            designation: true
          }
        }
      }
    });

    const parsedProjects = [];

    for (const proj of projects) {
      let workflowMeta: any = null;
      if (proj.description) {
        const match = proj.description.match(/\[WORKFLOW_STATE\](.*?)\[\/WORKFLOW_STATE\]/s);
        if (match && match[1]) {
          try {
            workflowMeta = JSON.parse(match[1]);
          } catch {
            workflowMeta = null;
          }
        }
      }

      const pData = workflowMeta?.productData || {};
      const currentStage = workflowMeta?.currentStage || 1;
      const isService = pData.projectType === 'service';

      // Physical product list
      const productsList = pData.productsList && Array.isArray(pData.productsList) && pData.productsList.length > 0
        ? pData.productsList
        : pData.productName
        ? [{
            id: 'legacy-1',
            name: pData.productName,
            quantity: pData.quantity || '1 item',
            condition: pData.condition || 'Good',
            notes: pData.notes || ''
          }]
        : [];

      // Determine product lifecycle status
      let productStatus: 'NO_PRODUCT' | 'PENDING_RECEIPT' | 'IN_STUDIO' | 'READY_FOR_RETURN' | 'RETURNED' = 'IN_STUDIO';
      if (isService && productsList.length === 0) {
        productStatus = 'NO_PRODUCT';
      } else if (pData.productReturned) {
        productStatus = 'RETURNED';
      } else if (currentStage >= 6 || proj.status === 'Completed') {
        productStatus = 'READY_FOR_RETURN';
      } else if (pData.received) {
        productStatus = 'IN_STUDIO';
      } else {
        productStatus = 'PENDING_RECEIPT';
      }

      const productItem = {
        projectId: proj.id,
        projectName: proj.name,
        projectCode: proj.projectCode || `PRJ-${proj.id.slice(0, 6).toUpperCase()}`,
        clientName: proj.clientName || 'Direct Client',
        clientPhone: proj.clientPhone || '',
        currentStage,
        projectStatus: proj.status,
        projectType: pData.projectType || 'product',
        productsList,
        totalItemsCount: productsList.length,
        received: Boolean(pData.received),
        productReturned: Boolean(pData.productReturned),
        productReturnDate: pData.productReturnDate || '',
        productReturnMethod: pData.productReturnMethod || 'In-Person Handover',
        productReturnNotes: pData.productReturnNotes || '',
        productReturnReceiver: pData.productReturnReceiver || proj.clientName || '',
        assignedProductManagerId: pData.assignedProductManagerId || proj.managerId || '',
        assignedProductManagerName: pData.assignedProductManagerName || (proj.manager ? `${proj.manager.firstName} ${proj.manager.lastName}` : 'Unassigned Product Manager'),
        assignedModelName: pData.assignedModelName || '',
        shootingDate: pData.shootingDate || '',
        shootingTime: pData.shootingTime || '',
        studioLocation: pData.studioLocation || 'Studio Main Floor',
        productStatus,
        updatedAt: proj.updatedAt
      };

      // Filter by status if specified
      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'IN_STUDIO' && productItem.productStatus !== 'IN_STUDIO') continue;
        if (statusFilter === 'READY_FOR_RETURN' && productItem.productStatus !== 'READY_FOR_RETURN') continue;
        if (statusFilter === 'RETURNED' && productItem.productStatus !== 'RETURNED') continue;
        if (statusFilter === 'PENDING_RECEIPT' && productItem.productStatus !== 'PENDING_RECEIPT') continue;
      }

      // Filter by search query if present
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = productItem.projectName.toLowerCase().includes(q);
        const matchCode = productItem.projectCode.toLowerCase().includes(q);
        const matchClient = productItem.clientName.toLowerCase().includes(q);
        const matchItems = productItem.productsList.some(
          (p: any) => p.name?.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q)
        );
        if (!matchName && !matchCode && !matchClient && !matchItems) continue;
      }

      parsedProjects.push(productItem);
    }

    return NextResponse.json({
      success: true,
      products: parsedProjects,
      stats: {
        total: parsedProjects.length,
        inStudio: parsedProjects.filter(p => p.productStatus === 'IN_STUDIO').length,
        readyForReturn: parsedProjects.filter(p => p.productStatus === 'READY_FOR_RETURN').length,
        returned: parsedProjects.filter(p => p.productStatus === 'RETURNED').length,
        pendingReceipt: parsedProjects.filter(p => p.productStatus === 'PENDING_RECEIPT').length
      }
    });
  } catch (error: any) {
    console.error("GET /api/staff/products Error:", error);
    return NextResponse.json({ error: "Failed to fetch staff products" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { projectId, action, returnData, managerId, managerName } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let workflowMeta: any = {
      currentStage: 1,
      completedStages: [],
      productData: {}
    };

    if (project.description) {
      const match = project.description.match(/\[WORKFLOW_STATE\](.*?)\[\/WORKFLOW_STATE\]/s);
      if (match && match[1]) {
        try {
          workflowMeta = JSON.parse(match[1]);
        } catch {}
      }
    }

    if (!workflowMeta.productData) {
      workflowMeta.productData = {};
    }

    if (action === 'RETURN') {
      workflowMeta.productData.productReturned = true;
      workflowMeta.productData.productReturnDate = returnData?.returnDate || new Date().toISOString().split('T')[0];
      workflowMeta.productData.productReturnMethod = returnData?.returnMethod || 'In-Person Handover';
      workflowMeta.productData.productReturnNotes = (returnData?.returnNotes || '').trim();
      workflowMeta.productData.productReturnReceiver = (returnData?.returnReceiver || project.clientName || 'Client').trim();
      if (managerId || managerName) {
        workflowMeta.productData.assignedProductManagerId = managerId || workflowMeta.productData.assignedProductManagerId;
        workflowMeta.productData.assignedProductManagerName = managerName || workflowMeta.productData.assignedProductManagerName;
      }
    } else if (action === 'REVERT_RETURN') {
      workflowMeta.productData.productReturned = false;
    } else if (action === 'RECEIVE') {
      workflowMeta.productData.received = true;
      if (managerId || managerName) {
        workflowMeta.productData.assignedProductManagerId = managerId || workflowMeta.productData.assignedProductManagerId;
        workflowMeta.productData.assignedProductManagerName = managerName || workflowMeta.productData.assignedProductManagerName;
      }
    } else if (action === 'ASSIGN_MANAGER') {
      workflowMeta.productData.assignedProductManagerId = managerId;
      workflowMeta.productData.assignedProductManagerName = managerName;
    }

    // Reconstruct description with updated workflow state
    const cleanDesc = (project.description || '').replace(/\[WORKFLOW_STATE\].*?\[\/WORKFLOW_STATE\]/s, '').trim();
    const newDesc = `${cleanDesc ? cleanDesc + '\n\n' : ''}[WORKFLOW_STATE]${JSON.stringify(workflowMeta)}[/WORKFLOW_STATE]`;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        description: newDesc,
        ...(managerId ? { managerId } : {})
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product state updated successfully",
      productData: workflowMeta.productData
    });
  } catch (error: any) {
    console.error("PATCH /api/staff/products Error:", error);
    return NextResponse.json({ error: "Failed to update product state" }, { status: 500 });
  }
}
