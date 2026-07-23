import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createCycle(companyId: string, name: string, startDate: Date, endDate: Date) {
  return prisma.performanceCycle.create({
    data: {
      companyId,
      name,
      startDate,
      endDate,
      status: 'ACTIVE'
    }
  });
}

export async function createGoal(employeeId: string, cycleId: string, goal: string, weight: number, target?: string) {
  return prisma.performanceGoal.create({
    data: {
      employeeId,
      cycleId,
      goal,
      weight,
      target
    }
  });
}

export async function submitSelfReview(employeeId: string, cycleId: string, reviewerId: string, comments: string, scores: { category: string, score: number, comments?: string }[]) {
  return prisma.$transaction(async (tx) => {
    // 1. Upsert Review Draft -> Self Submitted
    const review = await tx.performanceReview.upsert({
      where: {
        id: 'new' // Simplified for demonstration; realistically requires finding the active draft
      },
      update: {},
      create: {
        employeeId,
        reviewerId,
        cycleId,
        status: 'SELF_SUBMITTED'
      }
    });

    // 2. Attach Scores (as self-scores initially, or specific sub-scores)
    // Real-world: Distinguish between self-scores and manager-scores.
    
    // 3. Attach Feedback
    await tx.performanceFeedback.create({
      data: {
        reviewId: review.id,
        authorId: employeeId,
        type: 'SELF',
        feedback: comments
      }
    });

    return review;
  });
}

export async function submitManagerReview(reviewId: string, reviewerId: string, comments: string, scores: { category: string, score: number, comments?: string }[]) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.performanceReview.findUniqueOrThrow({ where: { id: reviewId } });

    if (review.reviewerId !== reviewerId) {
      throw new Error("Only the assigned reviewer can submit the manager review.");
    }

    // Insert Scores
    for (const s of scores) {
      await tx.performanceScore.create({
        data: {
          reviewId,
          category: s.category,
          score: s.score,
          comments: s.comments
        }
      });
    }

    // Insert Feedback
    await tx.performanceFeedback.create({
      data: {
        reviewId,
        authorId: reviewerId,
        type: 'MANAGER',
        feedback: comments
      }
    });

    return tx.performanceReview.update({
      where: { id: reviewId },
      data: { status: 'MANAGER_SUBMITTED' }
    });
  });
}

export async function calculateScore(reviewId: string) {
  // Pulls all PerformanceScore records, averages them, and computes overallRating
  const scores = await prisma.performanceScore.findMany({
    where: { reviewId }
  });

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum: number, s: any) => sum + Number(s.score), 0);
  const average = total / scores.length;

  await prisma.performanceReview.update({
    where: { id: reviewId },
    data: { overallRating: average }
  });

  return average;
}

export async function approveReview(reviewId: string) {
  // Calculates final score and locks the review
  await calculateScore(reviewId);
  return prisma.performanceReview.update({
    where: { id: reviewId },
    data: { status: 'APPROVED' }
  });
}

export async function createImprovementPlan(employeeId: string, cycleId: string, objectives: string, actions: string, targetDate: Date) {
  return prisma.performanceImprovementPlan.create({
    data: {
      employeeId,
      cycleId,
      objectives,
      actions,
      targetDate
    }
  });
}

export async function trackProgress(pipId: string, progressNote: string, status: string) {
  return prisma.performanceImprovementPlan.update({
    where: { id: pipId },
    data: {
      progress: progressNote,
      status // ACTIVE, COMPLETED, FAILED
    }
  });
}

export async function closeCycle(cycleId: string) {
  return prisma.performanceCycle.update({
    where: { id: cycleId },
    data: { status: 'CLOSED' }
  });
}
