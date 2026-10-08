import { NextResponse } from "next/server";
import { getCompanyId } from "@/lib/company/companyFilter";
import { customerAddressService } from "@/lib/crm/customerAddressService";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; addressId: string }> }) {
  try {
    const { addressId } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const address = await customerAddressService.updateAddress(companyId, addressId, data);
    return NextResponse.json(address);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; addressId: string }> }) {
  try {
    const { addressId } = await params;
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await customerAddressService.removeAddress(companyId, addressId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
