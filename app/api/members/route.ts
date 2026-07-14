import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let members = await prisma.member.findMany({
      orderBy: { createdAt: 'asc' }
    });

    if (members.length === 0) {
      // Seed default members
      const defaults = [
        { name: 'Yasin Araphat', role: 'CEO' },
        { name: 'Raihan Hasan', role: 'Chief Developer' },
        { name: 'Shafaeath Hosen', role: 'Advisor' }
      ];
      
      for (const d of defaults) {
        await prisma.member.create({
          data: {
            name: d.name,
            role: d.role
          }
        });
      }
      
      members = await prisma.member.findMany({
        orderBy: { createdAt: 'asc' }
      });
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name || !data.role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const member = await prisma.member.create({
      data: {
        name: data.name,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to create member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
