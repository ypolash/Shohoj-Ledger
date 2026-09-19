import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from "@/lib/rbac/permissionGuard";
import { getCompanyId } from "@/lib/company/companyFilter";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const params = await context.params;
    const { id } = params;
    const data = await request.json();
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.employee.findFirst({
      where: { id, companyId }
    });
    if (!existing) return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });

    const nameParts = data.name ? data.name.trim().split(' ') : null;
    const firstName = nameParts ? nameParts[0] : (data.firstName !== undefined ? data.firstName : existing.firstName);
    const lastName = nameParts ? nameParts.slice(1).join(' ') : (data.lastName !== undefined ? data.lastName : existing.lastName);

    let extraData: any = {};
    try {
      if (existing.location && existing.location.startsWith('{')) {
        extraData = JSON.parse(existing.location);
      }
    } catch (e) {}

    const updatedExtra = {
      ...extraData,
      ...(data.skills !== undefined ? { skills: Array.isArray(data.skills) ? data.skills : String(data.skills).split(',').map((s: string) => s.trim()) } : {}),
      ...(data.portfolioUrl !== undefined ? { portfolioUrl: data.portfolioUrl } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {})
    };

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        designation: data.role || data.designation || existing.designation,
        basicSalary: data.rate !== undefined ? Number(data.rate) : existing.basicSalary,
        status: data.status !== undefined ? data.status : existing.status,
        location: JSON.stringify(updatedExtra)
      }
    });

    return NextResponse.json({
      id: updated.id,
      name: `${updated.firstName} ${updated.lastName}`.trim(),
      email: updated.email,
      phone: updated.phone,
      role: updated.designation,
      rate: Number(updated.basicSalary) || 0,
      status: updated.status,
      skills: updatedExtra.skills,
      portfolioUrl: updatedExtra.portfolioUrl,
      notes: updatedExtra.notes
    });
  } catch (error) {
    console.error('Failed to update freelancer:', error);
    return NextResponse.json({ error: 'Failed to update freelancer' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const rbacGuard = await requirePermission("EMPLOYEE_MANAGE");
  if (rbacGuard) return rbacGuard;

  try {
    const params = await context.params;
    const { id } = params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.employee.findFirst({
      where: { id, companyId }
    });
    if (!existing) return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });

    await prisma.employee.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Freelancer deleted successfully' });
  } catch (error) {
    console.error('Failed to delete freelancer:', error);
    return NextResponse.json({ error: 'Failed to delete freelancer' }, { status: 500 });
  }
}
