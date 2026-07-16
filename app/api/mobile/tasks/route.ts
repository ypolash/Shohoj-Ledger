import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
        return NextResponse.json(
            { error: "employeeId is required" },
            { status: 400 }
        );
    }

    const tasks = await prisma.task.findMany({
        where: {
            assignedToEmployeeId: employeeId
        },
        orderBy: {
            dueDate: "asc"
        }
    });

    return NextResponse.json(tasks);
}