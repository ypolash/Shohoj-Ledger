import { AppShell } from "@/components/layout/AppShell/AppShell";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  let businessType = session?.user?.businessType;
  
  // If businessType is missing from an old session, fallback to database
  if (!businessType && session?.user?.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { businessType: true }
    });
    if (company) {
      businessType = company.businessType;
    }
  }
  
  businessType = businessType || 'Product + Service';

  return (
    <AppShell businessType={businessType}>
      {children}
    </AppShell>
  );
}
