import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Enterprise Health Check Endpoint
 * Pinged continuously by Kubernetes / Coolify / UptimeRobot to ensure
 * the application and database are correctly communicating.
 */
export async function GET() {
  try {
    const start = performance.now();
    
    // Quick, light ping to verify database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const latency = performance.now() - start;

    return NextResponse.json({
      status: "UP",
      database: "CONNECTED",
      latencyMs: Math.round(latency),
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime()
    }, { status: 200 });

  } catch (error) {
    console.error("Health Check Failed:", error);
    return NextResponse.json({
      status: "DOWN",
      database: "DISCONNECTED",
      timestamp: new Date().toISOString()
    }, { status: 503 }); // 503 Service Unavailable signals load balancers to drop this node
  }
}
