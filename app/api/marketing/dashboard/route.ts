import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireModule } from "@/lib/modules/moduleGuard";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(request: Request) {
  try {
    // Basic permissions - assuming marketing requires some CRM or marketing access
    // Since marketing might not have a dedicated permission yet, we can check for CRM_VIEW or a similar one, 
    // or just rely on module guard. Let's rely on module guard for CRM for now or we can just allow it if they have the module.
    const companyIdForGuard = await getCompanyId();
    // Assuming MARKETING or CRM module.
    const moduleGuard = await requireModule(companyIdForGuard, "CRM");
    if (moduleGuard) return moduleGuard;

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { ...(await withCompany()) },
      orderBy: { createdAt: 'desc' }
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === "ACTIVE").length;
    const totalReach = campaigns.reduce((acc: number, c: any) => acc + (c.reach || 0), 0);
    const conversions = campaigns.reduce((acc: number, c: any) => acc + (c.conversions || 0), 0);
    const totalSpend = campaigns.reduce((acc: number, c: any) => acc + Number(c.spend || 0), 0);
    
    // Simple ROI calculation: (conversions * 10 - spend) / spend for example purposes,
    // or just let the frontend calculate it or just provide raw data.
    // We will provide raw data and computed stats.
    
    // Prepare chart data (e.g., grouped by month or channel)
    const spendByChannel = campaigns.reduce((acc: any, c: any) => {
      const channel = c.channel || "Other";
      if (!acc[channel]) acc[channel] = 0;
      acc[channel] += Number(c.spend || 0);
      return acc;
    }, {});

    const chartData = Object.keys(spendByChannel).map(key => ({
      name: key,
      value: spendByChannel[key]
    }));

    return NextResponse.json({
      stats: {
        totalCampaigns,
        activeCampaigns,
        totalReach,
        conversions,
        totalSpend,
        roi: totalSpend > 0 ? ((conversions * 50 - totalSpend) / totalSpend * 100).toFixed(2) + "%" : "0%"
      },
      campaigns,
      chartData
    });
  } catch (error) {
    console.error("Error fetching marketing dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch marketing dashboard data" }, { status: 500 });
  }
}
