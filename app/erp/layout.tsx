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
  let companyName = "Shohoj Ledger";
  let logoUrl = null;
  
  if (session?.user?.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { businessType: true, name: true, logoUrl: true }
    });
    if (company) {
      businessType = company.businessType || businessType;
      companyName = company.name || companyName;
      logoUrl = company.logoUrl;
    }
  }
  
  businessType = businessType || 'Product + Service';

  return (
    <AppShell businessType={businessType} companyName={companyName} logoUrl={logoUrl}>
      {children}
    </AppShell>
  );
}
