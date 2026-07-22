import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { SubscriptionService, CompanySubscriptionState } from "./subscriptionService";

/**
 * Validates the company's subscription status.
 * If the subscription is SUSPENDED, halts the API request immediately.
 * 
 * Note: Since Phase 10 avoids schema modifications, this uses a mocked cache/state 
 * lookup for now. In Phase 11, it will fetch the CompanySubscription model from Prisma.
 */
export async function requireActiveSubscription() {
  const session = await getSession();

  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // PLATFORM_ADMIN bypasses billing
  if (session.user.platformRole === "SUPER_ADMIN") {
    return null;
  }

  // TODO: Replace with `await prisma.companySubscription.findUnique(...)`
  // Mocking the fetch to demonstrate the foundation without altering the schema.
  const mockedSubFetch: CompanySubscriptionState = {
    companyId: session.user.companyId,
    tier: "PRO",
    status: "ACTIVE", // Or TRIAL, PAST_DUE
    trialEndsAt: null,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gracePeriodEndsAt: null
  };

  const currentStatus = SubscriptionService.evaluateStatus(mockedSubFetch);

  if (currentStatus === "SUSPENDED") {
    return NextResponse.json(
      { 
        error: "Subscription Suspended", 
        message: "Your company's subscription has been suspended due to unpaid invoices. Please update your billing information." 
      }, 
      { status: 402 } // Payment Required
    );
  }

  if (currentStatus === "CANCELED") {
    return NextResponse.json(
      { 
        error: "Subscription Canceled", 
        message: "Your company's subscription is canceled." 
      }, 
      { status: 403 }
    );
  }

  // If PAST_DUE or TRIAL or ACTIVE, allow read/write operations (Grace period allows usage).
  // A frontend banner will usually warn PAST_DUE users without blocking the API.

  return null;
}
