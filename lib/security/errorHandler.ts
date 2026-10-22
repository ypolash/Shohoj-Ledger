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
    let errorCode = "INTERNAL_ERROR";

    if (error instanceof Error) {
      const errAny = error as any;
      const rawMsg = error.message || "";

      // Known validation & conflict errors that are safe and intended to inform the user
      const isKnownValidationError = 
        rawMsg.toLowerCase().includes("already registered") ||
        rawMsg.toLowerCase().includes("already exists") ||
        rawMsg.toLowerCase().includes("required") ||
        rawMsg.toLowerCase().includes("invalid credentials") ||
        errAny.code === "P2002" ||
        errAny.status === 400 ||
        errAny.statusCode === 400;

      if (isKnownValidationError) {
        statusCode = errAny.status || errAny.statusCode || 400;
        errorCode = "VALIDATION_ERROR";
        message = errAny.code === "P2002" 
          ? "A record with this information already exists."
          : rawMsg;
      } else if (!isProd) {
        message = rawMsg;
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
        error: statusCode === 500 ? "Internal Server Error" : "Validation Error", 
        message, 
        code: errorCode 
      }, 
      { status: statusCode }
    );
  }
}
