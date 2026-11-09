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
  let defaultPreset = "video_agency";
  
  if (session?.user?.companyId) {
    const [company, presetSetting] = await Promise.all([
      prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { businessType: true, name: true, logoUrl: true }
      }),
      prisma.systemSetting.findUnique({
        where: { key: `project_default_preset_${session.user.companyId}` }
      })
    ]);

    if (company) {
      businessType = company.businessType || businessType;
      companyName = company.name || companyName;
      logoUrl = company.logoUrl;
    }
    if (presetSetting?.value) {
      defaultPreset = presetSetting.value;
    }
  }
  
  businessType = businessType || 'Product + Service';

  return (
    <AppShell businessType={businessType} companyName={companyName} logoUrl={logoUrl} defaultPreset={defaultPreset}>
      {children}
    </AppShell>
  );
}
