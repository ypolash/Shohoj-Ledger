import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            notes: true,
            createdAt: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            businessType: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse Workflow Metadata from Description
    let parsedMeta: any = {};
    if (project.description) {
      const match = project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
      if (match) {
        try {
          parsedMeta = JSON.parse(match[1]);
        } catch (e) {
          console.error("Failed to parse workflow meta in portal API:", e);
        }
      }
    }

    // Multiple Revisions & Billing Policy Computation
    const demoData = parsedMeta?.demoData || {};
    const freeRevisionsIncluded = demoData.freeRevisionsIncluded !== undefined 
      ? Number(demoData.freeRevisionsIncluded) 
      : 2;
    const costPerRevision = demoData.costPerRevision !== undefined 
      ? Number(demoData.costPerRevision) 
      : 1000;
    const isSpecialCustomerFree = Boolean(demoData.isSpecialCustomerFree);

    const revisionsList = Array.isArray(parsedMeta?.revisions) ? parsedMeta.revisions : [];
    const totalRevisionsCount = revisionsList.length;
    const freeRevisionsUsed = isSpecialCustomerFree 
      ? totalRevisionsCount 
      : Math.min(freeRevisionsIncluded, totalRevisionsCount);
    const billableRevisionsCount = isSpecialCustomerFree 
      ? 0 
      : Math.max(0, totalRevisionsCount - freeRevisionsIncluded);
    const totalRevisionFees = billableRevisionsCount * costPerRevision;

    const baseBudget = Number(project.estimatedBudget || 0);
    const effectiveBudget = baseBudget + totalRevisionFees;
    const totalPaid = project.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const due = Math.max(0, effectiveBudget - totalPaid);

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        clientName: project.clientName,
        clientPhone: project.clientPhone,
        status: project.status,
        progress: project.progress !== null && project.progress !== undefined ? project.progress : 0,
        category: project.category,
        createdAt: project.createdAt,
        expectedShootingDate: (project as any).expectedShootingDate || null,
        expectedEditingDate: (project as any).expectedEditingDate || null,
        baseBudget,
        budget: effectiveBudget,
        totalRevisionFees,
        totalPaid,
        due,
        payments: project.payments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          notes: p.notes,
          createdAt: p.createdAt
        })),
        company: project.company,
        currentStage: parsedMeta?.currentStage || (project.status === 'Completed' ? 7 : 4),
        completedStages: parsedMeta?.completedStages || [],
        stageNames: parsedMeta?.stageNames || {
          1: "Draft",
          2: "Advance Received",
          3: "Product Received",
          4: "Shooting",
          5: "Editing",
          6: "Demo",
          7: "Complete"
        },
        productData: parsedMeta?.productData || null,
        shootingData: parsedMeta?.shootingData || null,
        editingData: parsedMeta?.editingData || null,
        demoData: {
          ...demoData,
          freeRevisionsIncluded,
          costPerRevision,
          isSpecialCustomerFree,
          totalRevisionsCount,
          freeRevisionsUsed,
          billableRevisionsCount,
          totalRevisionFees
        },
        revisionPolicy: {
          freeRevisionsIncluded,
          costPerRevision,
          isSpecialCustomerFree,
          totalRevisionsCount,
          freeRevisionsUsed,
          billableRevisionsCount,
          totalRevisionFees
        },
        reviewData: parsedMeta?.reviewData || null,
        editorRating: parsedMeta?.editorRating || null,
        revisions: revisionsList,
        revisionChat: parsedMeta?.revisionChat || []
      }
    });
  } catch (err: any) {
    console.error("Portal API Error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const { action } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let parsedMeta: any = {
      currentStage: 4,
      completedStages: [],
      stageNames: {},
      productData: {},
      shootingData: {},
      editingData: {},
      demoData: {
        freeRevisionsIncluded: 2,
        costPerRevision: 1000,
        isSpecialCustomerFree: false,
        demoFiles: []
      },
      revisions: [],
      revisionChat: [],
      reviewData: null,
      editorRating: null
    };

    let baseDesc = project.description || '';
    const metaTagRegex = /\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/;
    const match = baseDesc.match(metaTagRegex);
    if (match) {
      try {
        parsedMeta = { ...parsedMeta, ...JSON.parse(match[1]) };
      } catch (e) {
        console.error("Failed to parse workflow meta in POST:", e);
      }
    }

    const demoData = parsedMeta.demoData || {};
    const freeRevisionsIncluded = demoData.freeRevisionsIncluded !== undefined 
      ? Number(demoData.freeRevisionsIncluded) 
      : 2;
    const costPerRevision = demoData.costPerRevision !== undefined 
      ? Number(demoData.costPerRevision) 
      : 1000;
    const isSpecialCustomerFree = Boolean(demoData.isSpecialCustomerFree);

    if (action === 'SEND_CHAT_MESSAGE') {
      const { sender, senderName, type, text, imageUrl, audioUrl, audioDuration, timecode } = body;
      if (!text?.trim() && !imageUrl && !audioUrl) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }

      const newMsg = {
        id: String(Date.now()),
        sender: sender || 'CLIENT', // 'CLIENT' | 'STUDIO' | 'EDITOR'
        senderName: senderName || (sender === 'CLIENT' ? (project.clientName || 'Client') : sender === 'EDITOR' ? (parsedMeta.shootingData?.assignedEditorName || 'Editor') : 'Studio Manager'),
        type: type || (audioUrl ? 'VOICE' : imageUrl ? 'IMAGE' : 'TEXT'),
        text: text?.trim() || '',
        imageUrl: imageUrl || '',
        audioUrl: audioUrl || '',
        audioDuration: audioDuration || 0,
        timecode: timecode?.trim() || '',
        createdAt: new Date().toISOString()
      };

      const existingChat = Array.isArray(parsedMeta.revisionChat) ? parsedMeta.revisionChat : [];
      parsedMeta.revisionChat = [...existingChat, newMsg];

      // If client sends message, mark demo status
      if (sender === 'CLIENT') {
        parsedMeta.demoData = {
          ...(parsedMeta.demoData || {}),
          approvalStatus: 'Revision Requested',
          revisionCount: (parsedMeta.demoData?.revisionCount || 0) + 1
        };
      }
    } else if (action === 'SUBMIT_REVISION') {
      const { revisionNote, title, clientName, timecode } = body;
      if (!revisionNote || !revisionNote.trim()) {
        return NextResponse.json({ error: 'Revision note cannot be empty' }, { status: 400 });
      }

      const existingRevisions = Array.isArray(parsedMeta.revisions) ? parsedMeta.revisions : [];
      const roundNumber = existingRevisions.length + 1;
      const isBillable = !isSpecialCustomerFree && roundNumber > freeRevisionsIncluded;
      const cost = isBillable ? costPerRevision : 0;

      const newRevision = {
        id: String(Date.now()),
        roundNumber,
        title: title?.trim() || `Revision Round #${roundNumber}`,
        note: revisionNote.trim(),
        clientName: clientName?.trim() || project.clientName || 'Client',
        timecode: timecode?.trim() || '',
        isBillable,
        cost,
        createdAt: new Date().toISOString(),
        status: 'Pending'
      };

      parsedMeta.revisions = [newRevision, ...existingRevisions];

      // Append to Revision Chat thread
      const chatBadge = isSpecialCustomerFree 
        ? '👑 VIP Free Revision' 
        : isBillable 
        ? `💳 Billable Fee: BDT ${cost}` 
        : `✓ Free Included (${roundNumber}/${freeRevisionsIncluded})`;

      const chatMsg = {
        id: String(Date.now()),
        sender: 'CLIENT',
        senderName: clientName?.trim() || project.clientName || 'Client',
        type: 'TEXT',
        text: `[📋 Revision Round #${roundNumber} • ${chatBadge}]\n${revisionNote.trim()}`,
        timecode: timecode?.trim() || '',
        createdAt: new Date().toISOString()
      };
      const existingChat = Array.isArray(parsedMeta.revisionChat) ? parsedMeta.revisionChat : [];
      parsedMeta.revisionChat = [...existingChat, chatMsg];

      // Update demoData
      parsedMeta.demoData = {
        ...(parsedMeta.demoData || {}),
        approvalStatus: 'Revision Requested',
        revisionCount: roundNumber,
        freeRevisionsIncluded,
        costPerRevision,
        isSpecialCustomerFree,
        revisionNotes: `[Revision #${roundNumber} - ${new Date().toLocaleDateString()} (${chatBadge})]: ${revisionNote.trim()}${parsedMeta.demoData?.revisionNotes ? `\n\n${parsedMeta.demoData.revisionNotes}` : ''}`
      };
    } else if (action === 'UPDATE_REVISION_POLICY') {
      const { freeRevisionsIncluded: freeInc, costPerRevision: costPer, isSpecialCustomerFree: isVip } = body;
      parsedMeta.demoData = {
        ...(parsedMeta.demoData || {}),
        freeRevisionsIncluded: Number(freeInc ?? freeRevisionsIncluded),
        costPerRevision: Number(costPer ?? costPerRevision),
        isSpecialCustomerFree: Boolean(isVip)
      };
    } else if (action === 'SUBMIT_EDITOR_DEMO') {
      const { demoName, demoUrl, editorNotes, editorName } = body;
      if (!demoName?.trim() || !demoUrl?.trim()) {
        return NextResponse.json({ error: 'Demo label and URL are required' }, { status: 400 });
      }

      const newDemoFile = {
        id: String(Date.now()),
        name: demoName.trim(),
        url: demoUrl.trim(),
        note: editorNotes?.trim() || '',
        date: new Date().toLocaleDateString(),
        uploadedBy: editorName?.trim() || parsedMeta.shootingData?.assignedEditorName || 'Lead Editor'
      };

      const existingDemoFiles = Array.isArray(parsedMeta.demoData?.demoFiles) ? parsedMeta.demoData.demoFiles : [];
      parsedMeta.demoData = {
        ...(parsedMeta.demoData || {}),
        demoFiles: [...existingDemoFiles, newDemoFile],
        approvalStatus: 'Pending Review'
      };

      parsedMeta.editingData = {
        ...(parsedMeta.editingData || {}),
        status: 'Review Ready',
        editorNotes: editorNotes?.trim()
          ? `${parsedMeta.editingData?.editorNotes ? `${parsedMeta.editingData.editorNotes}\n\n` : ''}[Editor Upload ${new Date().toLocaleDateString()}]: ${editorNotes.trim()}`
          : parsedMeta.editingData?.editorNotes || ''
      };
    } else if (action === 'APPROVE_DEMO') {
      parsedMeta.demoData = {
        ...(parsedMeta.demoData || {}),
        approvalStatus: 'Approved',
        approvedAt: new Date().toISOString()
      };
    } else if (action === 'SUBMIT_REVIEW') {
      const { rating, reviewText, clientName } = body;
      if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return NextResponse.json({ error: 'Valid rating between 1 and 5 is required' }, { status: 400 });
      }

      parsedMeta.reviewData = {
        rating: Number(rating),
        reviewText: reviewText?.trim() || '',
        clientName: clientName?.trim() || project.clientName || 'Client',
        submittedAt: new Date().toISOString()
      };
    } else if (action === 'RATE_EDITOR') {
      const { rating, feedback, ratedBy } = body;
      if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return NextResponse.json({ error: 'Valid rating between 1 and 5 is required' }, { status: 400 });
      }

      parsedMeta.editorRating = {
        rating: Number(rating),
        feedback: feedback?.trim() || '',
        ratedBy: ratedBy?.trim() || 'Studio Team',
        submittedAt: new Date().toISOString()
      };
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Save updated metadata back to project description
    const metaString = `[[WORKFLOW_META_V1:${JSON.stringify(parsedMeta)}]]`;
    let newDescription = baseDesc;
    if (metaTagRegex.test(baseDesc)) {
      newDescription = baseDesc.replace(metaTagRegex, metaString);
    } else {
      newDescription = baseDesc ? `${baseDesc}\n\n${metaString}` : metaString;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { description: newDescription }
    });

    return NextResponse.json({
      success: true,
      message: action === 'SUBMIT_REVISION'
        ? 'Revision request submitted successfully!'
        : action === 'APPROVE_DEMO'
        ? 'Demo approved successfully!'
        : 'Action processed successfully!',
      workflowMeta: parsedMeta
    });
  } catch (err: any) {
    console.error("Portal API POST Error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

