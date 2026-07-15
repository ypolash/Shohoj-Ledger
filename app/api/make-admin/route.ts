import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.user.update({
      where: { email: 'yapbit3@gmail.com' },
      data: { role: 'admin' }
    });
    
    await prisma.user.update({
      where: { email: 'ryanhasan360@gmail.com' },
      data: { role: 'admin' }
    });
    
    return NextResponse.json({ success: true, message: "Roles updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
