import { NextResponse } from "next/server";

const demoTasks = [
    {
        id: "1",
        title: "Complete dashboard",
        description: "Finish the CRM dashboard UI",
        priority: "High",
        status: "Pending",
        dueDate: "2026-07-20"
    },
    {
        id: "2",
        title: "Prepare proposal",
        description: "Create client proposal document",
        priority: "Medium",
        status: "In Progress",
        dueDate: "2026-07-22"
    }
];

export async function GET(req: Request) {
    return NextResponse.json(demoTasks);
}