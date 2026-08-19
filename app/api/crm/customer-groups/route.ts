import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch existing customer groups for this company
    let groups = await prisma.customerGroup.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });

    // If none exist, create some default ones
    if (groups.length === 0) {
      const defaultGroups = ["Retail", "Wholesale", "Corporate/Enterprise"];
      for (const name of defaultGroups) {
        await prisma.customerGroup.create({
          data: {
            companyId,
            name
          }
        });
      }
      
      // Refetch after creating defaults
      groups = await prisma.customerGroup.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Error fetching customer groups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
