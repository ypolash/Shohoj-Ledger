import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getCompanyId } from "@/lib/company/companyFilter";
import { requirePermission } from "@/lib/rbac/permissionGuard";

export async function GET(req: Request) {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("VIEW_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const industry = url.searchParams.get("industry");
    const status = url.searchParams.get("status");
    const country = url.searchParams.get("country");

    const where: any = { companyId };
    if (industry) where.industry = industry;
    if (status) where.status = status;
    if (country) where.country = country;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clientCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { projects: true, leads: true, contacts: true, documents: true } }
      }
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("GET Clients Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const companyId = await getCompanyId();
    const session = await getSession();
    if (!companyId || !session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rbacGuard = await requirePermission("CREATE_CLIENTS");
    if (rbacGuard) return rbacGuard;

    const body = await req.json();
    const { 
      clientCode, name, email, phone, altPhone, website, industry, 
      businessType, taxNumber, address, country, city, postalCode, 
      status, notes, tags 
    } = body;

    if (!name || !clientCode) {
      return NextResponse.json({ error: "Client Name and Code are required." }, { status: 400 });
    }

    // Duplicate Check
    const orConditions: any[] = [{ clientCode }];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });
    if (taxNumber) orConditions.push({ taxNumber });

    const existing = await prisma.client.findFirst({
      where: {
        companyId,
        OR: orConditions
      }
    });

    if (existing) {
      return NextResponse.json({ error: "A client with this Code, Email, Phone, or Tax Number already exists." }, { status: 400 });
    }

    const newClient = await prisma.$transaction(async (tx) => {
      const c = await tx.client.create({
        data: {
          companyId,
          clientCode,
          name,
          email,
          phone,
          altPhone,
          website,
          industry,
          businessType,
          taxNumber,
          address,
          country,
          city,
          postalCode,
          status: status || "ACTIVE",
          notes,
          tags: tags || []
        }
      });

      await tx.clientActivity.create({
        data: {
          companyId,
          clientId: c.id,
          type: "CREATED",
          description: `Client ${name} created`,
          performedById: session.user.id
        }
      });

      return c;
    });

    return NextResponse.json({ client: newClient });
  } catch (error) {
    console.error("POST Client Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
