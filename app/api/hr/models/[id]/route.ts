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
    if (!existing) return NextResponse.json({ error: 'Model talent not found' }, { status: 404 });

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
      ...(data.agency !== undefined ? { agency: data.agency } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.height !== undefined ? { height: data.height } : {}),
      ...(data.measurements !== undefined ? { measurements: data.measurements } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.compCardUrl !== undefined ? { compCardUrl: data.compCardUrl } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {})
    };

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        department: updatedExtra.agency || existing.department,
        designation: updatedExtra.category ? `${updatedExtra.category} Model` : existing.designation,
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
      agency: updatedExtra.agency,
      category: updatedExtra.category,
      rate: Number(updated.basicSalary) || 0,
      height: updatedExtra.height,
      measurements: updatedExtra.measurements,
      gender: updatedExtra.gender,
      compCardUrl: updatedExtra.compCardUrl,
      status: updated.status,
      notes: updatedExtra.notes
    });
  } catch (error) {
    console.error('Failed to update model talent:', error);
    return NextResponse.json({ error: 'Failed to update model talent' }, { status: 500 });
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
    if (!existing) return NextResponse.json({ error: 'Model talent not found' }, { status: 404 });

    await prisma.employee.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Model talent deleted successfully' });
  } catch (error) {
    console.error('Failed to delete model talent:', error);
    return NextResponse.json({ error: 'Failed to delete model talent' }, { status: 500 });
  }
}
