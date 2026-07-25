import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let categories = await prisma.incomeCategory.findMany({
      where: { ...(await withCompany()) },
      orderBy: { name: 'asc' }
    });

    // Auto-seed default categories if empty
    if (categories.length === 0) {
      const defaultCategories = [
        { name: "Marketing" },
        { name: "Consulting" },
        { name: "Development" },
        { name: "Maintenance" },
        { name: "Support" },
        { name: "Training" }
      ];

      await prisma.incomeCategory.createMany({
        data: defaultCategories.map(c => ({ ...c, companyId: companyIdForGuard })),
        skipDuplicates: true
      });

      categories = await prisma.incomeCategory.findMany({
        where: { ...(await withCompany()) },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching income categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.incomeCategory.create({
      data: { name, companyId: companyIdForGuard }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating income category:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const companyIdForGuard = await getCompanyId();
  if (!companyIdForGuard) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const category = await prisma.incomeCategory.findFirst({
      where: { ...(await withCompany()), id }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.incomeCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
