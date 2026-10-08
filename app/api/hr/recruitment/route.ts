import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCompany } from "@/lib/company/companyFilter";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const jobOpeningId = searchParams.get('jobOpeningId');

    const [jobOpenings, applications, applicants, departments, designations, employees] = await Promise.all([
      prisma.jobOpening.findMany({
        where: { companyId },
        include: {
          department: true,
          designation: true,
          _count: { select: { applications: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.application.findMany({
        where: {
          jobOpening: { companyId },
          ...(jobOpeningId ? { jobOpeningId } : {})
        },
        include: {
          applicant: true,
          jobOpening: {
            include: {
              department: true,
              designation: true
            }
          },
          interviews: {
            include: {
              interviewer: true,
              feedbacks: true
            }
          },
          jobOffers: true
        },
        orderBy: { appliedAt: 'desc' }
      }),
      prisma.applicant.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.department.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true }
      }),
      prisma.designation.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true }
      }),
      prisma.employee.findMany({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, employeeId: true, designation: true }
      })
    ]);

    // Pipeline metrics
    const stats = {
      totalJobs: jobOpenings.length,
      openJobs: jobOpenings.filter(j => j.status === 'OPEN').length,
      totalApplicants: applicants.length,
      stageCounts: {
        APPLIED: applications.filter(a => a.currentStage === 'APPLIED').length,
        SCREENING: applications.filter(a => a.currentStage === 'SCREENING').length,
        INTERVIEW: applications.filter(a => a.currentStage === 'INTERVIEW').length,
        OFFER: applications.filter(a => a.currentStage === 'OFFER').length,
        HIRED: applications.filter(a => a.currentStage === 'HIRED').length,
        REJECTED: applications.filter(a => a.currentStage === 'REJECTED').length,
      }
    };

    return NextResponse.json({
      jobOpenings,
      applications,
      applicants,
      departments,
      designations,
      employees,
      stats
    });
  } catch (error) {
    console.error('Failed to fetch recruitment data:', error);
    return NextResponse.json({ error: 'Failed to fetch recruitment data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const companyFilter = await withCompany();
  const companyId = companyFilter.companyId;

  if (!companyId) {
    return NextResponse.json({ error: 'Company context required' }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.user?.id;

  try {
    const body = await request.json();
    const { action } = body;

    // 1. Create Job Opening
    if (action === 'CREATE_JOB') {
      const { title, departmentId, designationId, vacancies, openingDate, closingDate, jobCode } = body;
      if (!title || !openingDate) {
        return NextResponse.json({ error: 'Title and opening date are required' }, { status: 400 });
      }

      const job = await prisma.jobOpening.create({
        data: {
          companyId,
          title,
          jobCode: jobCode || `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
          departmentId: departmentId || null,
          designationId: designationId || null,
          vacancies: Number(vacancies) || 1,
          openingDate: new Date(openingDate),
          closingDate: closingDate ? new Date(closingDate) : null,
          status: 'OPEN',
          createdById: userId || null
        }
      });
      return NextResponse.json(job, { status: 201 });
    }

    // 2. Add Candidate / Applicant
    if (action === 'ADD_APPLICANT') {
      const { fullName, email, phone, jobOpeningId, resume, linkedin, portfolio, currentStage = 'APPLIED' } = body;
      if (!fullName || !email || !jobOpeningId) {
        return NextResponse.json({ error: 'Candidate name, email, and Job Opening are required' }, { status: 400 });
      }

      // Upsert applicant
      let applicant = await prisma.applicant.findFirst({
        where: { companyId, email }
      });

      if (!applicant) {
        applicant = await prisma.applicant.create({
          data: {
            companyId,
            fullName,
            email,
            phone: phone || null,
            resume: resume || null,
            linkedin: linkedin || null,
            portfolio: portfolio || null,
            status: 'ACTIVE'
          }
        });
      }

      // Create application
      const application = await prisma.application.create({
        data: {
          jobOpeningId,
          applicantId: applicant.id,
          currentStage,
          source: body.source || 'Direct Portal'
        },
        include: {
          applicant: true,
          jobOpening: true
        }
      });

      return NextResponse.json(application, { status: 201 });
    }

    // 3. Update Pipeline Stage
    if (action === 'UPDATE_STAGE') {
      const { applicationId, newStage } = body;
      if (!applicationId || !newStage) {
        return NextResponse.json({ error: 'Application ID and new stage required' }, { status: 400 });
      }

      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { currentStage: newStage }
      });
      return NextResponse.json(updated);
    }

    // 4. Schedule Interview
    if (action === 'SCHEDULE_INTERVIEW') {
      const { applicationId, type, date, interviewerId, location, onlineLink } = body;
      if (!applicationId || !interviewerId || !date) {
        return NextResponse.json({ error: 'Application, interviewer, and date required' }, { status: 400 });
      }

      const interview = await prisma.interview.create({
        data: {
          applicationId,
          type: type || 'Technical Interview',
          date: new Date(date),
          interviewerId,
          location: location || null,
          onlineLink: onlineLink || null,
          status: 'SCHEDULED'
        }
      });

      // Advance stage to INTERVIEW if not already
      await prisma.application.update({
        where: { id: applicationId },
        data: { currentStage: 'INTERVIEW' }
      });

      return NextResponse.json(interview, { status: 201 });
    }

    // 5. Submit Interview Feedback / Scorecard
    if (action === 'SUBMIT_FEEDBACK') {
      const { interviewId, interviewerId, technicalScore, communicationScore, cultureScore, overallScore, recommendation, comments } = body;
      if (!interviewId || !interviewerId) {
        return NextResponse.json({ error: 'Interview ID and interviewer required' }, { status: 400 });
      }

      const feedback = await prisma.interviewFeedback.create({
        data: {
          interviewId,
          interviewerId,
          technicalScore: Number(technicalScore) || 5,
          communicationScore: Number(communicationScore) || 5,
          cultureScore: Number(cultureScore) || 5,
          overallScore: Number(overallScore) || 5,
          recommendation: recommendation || 'HIRE',
          comments: comments || null
        }
      });

      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' }
      });

      return NextResponse.json(feedback, { status: 201 });
    }

    // 6. Extend Job Offer
    if (action === 'MAKE_OFFER') {
      const { applicationId, salary, joiningDate, designationId, departmentId } = body;
      if (!applicationId || !salary || !joiningDate) {
        return NextResponse.json({ error: 'Application, offered salary, and joining date required' }, { status: 400 });
      }

      const offer = await prisma.jobOffer.create({
        data: {
          applicationId,
          salary: Number(salary),
          joiningDate: new Date(joiningDate),
          designationId: designationId || null,
          departmentId: departmentId || null,
          status: 'PENDING'
        }
      });

      await prisma.application.update({
        where: { id: applicationId },
        data: { currentStage: 'OFFER' }
      });

      return NextResponse.json(offer, { status: 201 });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process recruitment action:', error);
    return NextResponse.json({ error: 'Failed to process recruitment action' }, { status: 500 });
  }
}
