import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function createProgram(companyId: string, code: string, title: string, category: string, description?: string, durationHours?: number) {
  return prisma.trainingProgram.create({
    data: {
      companyId,
      code,
      title,
      description,
      category,
      durationHours,
      status: 'ACTIVE'
    }
  });
}

export async function scheduleSession(programId: string, trainerId: string, scheduleStart: Date, scheduleEnd: Date, capacity?: number, location?: string, onlineLink?: string) {
  return prisma.trainingSession.create({
    data: {
      programId,
      trainerId,
      scheduleStart,
      scheduleEnd,
      capacity,
      location,
      onlineLink,
      status: 'SCHEDULED'
    }
  });
}

export async function enrollEmployee(sessionId: string, employeeId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.trainingSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { _count: { select: { enrollments: true } } }
    });

    if (session.capacity && session._count.enrollments >= session.capacity) {
      throw new Error("Training session capacity reached.");
    }

    const existing = await tx.trainingEnrollment.findFirst({
      where: { sessionId, employeeId }
    });

    if (existing) {
      throw new Error("Employee is already enrolled in this session.");
    }

    return tx.trainingEnrollment.create({
      data: {
        sessionId,
        employeeId,
        status: 'ENROLLED'
      }
    });
  });
}

export async function recordAttendance(enrollmentId: string, status: string, remarks?: string) {
  return prisma.trainingAttendance.create({
    data: {
      enrollmentId,
      status, // PRESENT, ABSENT, LATE
      remarks
    }
  });
}

export async function recordAssessment(enrollmentId: string, evaluatorId: string, result: string, score?: number, remarks?: string) {
  return prisma.trainingAssessment.create({
    data: {
      enrollmentId,
      evaluatorId,
      result, // PASS, FAIL
      score,
      remarks
    }
  });
}

export async function issueCertificate(enrollmentId: string, documentUrl?: string, expiryDate?: Date) {
  return prisma.$transaction(async (tx) => {
    // Verify assessment passage
    const assessment = await tx.trainingAssessment.findFirst({
      where: { enrollmentId, result: 'PASS' }
    });

    if (!assessment) {
      throw new Error("Cannot issue certificate without a PASS assessment.");
    }

    const cert = await tx.trainingCertificate.create({
      data: {
        enrollmentId,
        certificateNumber: `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        documentUrl,
        expiryDate
      }
    });

    // Mark complete
    await tx.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'COMPLETED' }
    });

    return cert;
  });
}

export async function completeTraining(sessionId: string) {
  return prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  });
}

export async function getTrainingHistory(employeeId: string) {
  return prisma.trainingEnrollment.findMany({
    where: { employeeId },
    include: {
      session: {
        include: { program: true }
      },
      assessments: true,
      certificates: true
    }
  });
}
