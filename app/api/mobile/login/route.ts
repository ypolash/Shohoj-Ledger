import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employeeId, password } = body;

        const employee = await prisma.employee.findUnique({
            where: { employeeId }
        });

        console.log("Login employeeId:", employeeId);
        console.log("Employee found:", !!employee);

        let passwordMatch = false;
        if (employee && employee.password) {
            passwordMatch = await bcrypt.compare(password, employee.password);
            
            // Fallback for existing plaintext passwords
            if (!passwordMatch && employee.password === password) {
                passwordMatch = true;
            }
        }

        console.log("Password match:", passwordMatch);

        if (employee && passwordMatch) {
            return NextResponse.json({
                success: true,
                token: "demo-token-123", // Keep dummy token for now if real JWT logic isn't requested
                employee: {
                    employeeId: employee.employeeId,
                    name: `${employee.firstName} ${employee.lastName}`,
                    position: employee.designation || "Employee"
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
        console.error("Login API Error:", error);
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