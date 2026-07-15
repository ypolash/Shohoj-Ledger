import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employeeId, password } = body;

        // Demo login
        if (employeeId === "EMP-1001" && password === "123456") {
            return NextResponse.json({
                success: true,
                token: "demo-token-123",
                employee: {
                    employeeId: "EMP-1001",
                    name: "Demo Employee",
                    position: "Developer"
                }
            });
        }

        return NextResponse.json(
            {
                success: false,
                message: "Invalid Employee ID or Password"
            },
            {
                status: 401
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Server error"
            },
            {
                status: 500
            }
        );
    }
}