import { NextResponse } from "next/server";

export class ApiErrorHandler {
  /**
   * Centralized Error Handler for API Routes
   * Formats errors securely (masking stack traces in production) and logs them automatically.
   */
  static handle(error: unknown, context?: string) {
    const isProd = process.env.NODE_ENV === "production";
    
    let message = "An unexpected internal server error occurred.";
    let statusCode = 500;

    if (error instanceof Error) {
      // Don't leak exact Prisma or DB errors in production
      if (!isProd) {
        message = error.message;
      }
      
      console.error(JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        context: context || "API_ROUTE",
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error("Unknown Error:", error);
    }

    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message, 
        code: "INTERNAL_ERROR" 
      }, 
      { status: statusCode }
    );
  }
}
