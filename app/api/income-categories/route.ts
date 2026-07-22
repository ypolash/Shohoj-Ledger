import { verifyOwnership } from "@/lib/company/verifyOwnership";
import { withCompany, getCompanyId } from "@/lib/company/companyFilter";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    let categories = await prisma.incomeCategory.findMany({
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
        data: defaultCategories,
        skipDuplicates: true
      });

      categories = await prisma.incomeCategory.findMany({
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
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.incomeCategory.create({
      data: { name }
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
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    await prisma.incomeCategory.delete({
      where: { ...(await withCompany()), id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
