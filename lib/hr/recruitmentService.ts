import { PrismaClient } from '@prisma/client';
import { createEmployee } from './employeeService';

const prisma = new PrismaClient();

export async function createJobOpening(companyId: string, data: any) {
  return prisma.jobOpening.create({
    data: {
      ...data,
      companyId,
    }
  });
}

export async function publishJob(jobOpeningId: string) {
  return prisma.jobOpening.update({
    where: { id: jobOpeningId },
    data: { status: 'OPEN', openingDate: new Date() }
  });
}

export async function createApplicant(companyId: string, data: any) {
  return prisma.applicant.create({
    data: {
      ...data,
      companyId
    }
  });
}

export async function submitApplication(applicantId: string, jobOpeningId: string, source?: string) {
  return prisma.application.create({
    data: {
      applicantId,
      jobOpeningId,
      source
    }
  });
}

export async function scheduleInterview(applicationId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const interview = await tx.interview.create({
      data: {
        ...data,
        applicationId
      }
    });

    await tx.application.update({
      where: { id: applicationId },
      data: { currentStage: 'INTERVIEW' }
    });

    return interview;
  });
}

export async function recordFeedback(interviewId: string, data: any) {
  return prisma.interviewFeedback.create({
    data: {
      ...data,
      interviewId
    }
  });
}

export async function createOffer(applicationId: string, data: any) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.jobOffer.create({
      data: {
        ...data,
        applicationId
      }
    });

    await tx.application.update({
      where: { id: applicationId },
      data: { currentStage: 'OFFERED' }
    });

    return offer;
  });
}

export async function acceptOffer(offerId: string) {
  return prisma.jobOffer.update({
    where: { id: offerId },
    data: { status: 'ACCEPTED' }
  });
}

export async function rejectOffer(offerId: string) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.jobOffer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' }
    });

    await tx.application.update({
      where: { id: offer.applicationId },
      data: { currentStage: 'REJECTED' }
    });

    return offer;
  });
}

export async function hireApplicant(applicationId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { currentStage: 'HIRED' }
    });

    const application = await tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: {
        applicant: true,
        jobOpening: true,
        jobOffers: {
          where: { status: 'ACCEPTED' }
        }
      }
    });
    
    const applicant = await tx.applicant.update({
        where: { id: application.applicantId },
        data: { status: 'HIRED' }
    });

    return convertToEmployee(application);
  });
}

async function convertToEmployee(application: any) {
  const { applicant, jobOpening, jobOffers } = application;
  const offer = jobOffers[0];

  if (!offer) {
    throw new Error('No accepted Job Offer found to convert to Employee');
  }

  // Map Applicant and Offer details into Employee payload
  // Split fullName into firstName and lastName safely
  const nameParts = applicant.fullName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const employeePayload = {
    firstName,
    lastName,
    email: applicant.email,
    phone: applicant.phone,
    joinDate: offer.joiningDate,
    basicSalary: offer.salary,
    designation: 'Auto-Mapped', // Legacy compliance
    designationId: offer.designationId,
    departmentId: offer.departmentId,
    employeeId: `EMP-${Date.now()}`,
    employmentTypeId: jobOpening.employmentTypeId,
    profile: {
        dateOfBirth: applicant.dateOfBirth,
        resume: applicant.resume,
        linkedin: applicant.linkedin
    }
  };

  // Defer exclusively to the EmployeeService to ensure no duplicate rules
  return await createEmployee(applicant.companyId, employeePayload);
}

export async function validateApplication(companyId: string, applicationId: string) {
  const app = await prisma.application.findFirst({
    where: { 
      id: applicationId,
      jobOpening: { companyId }
    }
  });
  
  if (!app) {
    throw new Error('Application not found or unauthorized access');
  }
  return true;
}
