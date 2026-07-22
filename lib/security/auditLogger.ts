/**
 * Audit Logger Service
 * 
 * Captures sensitive mutation events (POST, PUT, DELETE) and records them.
 * In a future scaling phase, this will push directly to a message queue (e.g. SQS)
 * or a dedicated Audit table rather than stdout.
 */
export class AuditLogger {
  
  /**
   * Log an administrative or sensitive data change.
   */
  static logActivity(payload: {
    actorId: string;
    companyId: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: any;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "AUDIT",
      ...payload
    };

    // In production, this stdout log is scraped by DataDog/ELK stack.
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log critical security events like failed logins, permission denials, or suspended access attempts.
   */
  static logSecurityEvent(payload: {
    ip: string;
    event: "LOGIN_FAILED" | "UNAUTHORIZED_ACCESS" | "BRUTE_FORCE_ATTEMPT";
    details: string;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "SECURITY",
      ...payload
    };

    console.warn(JSON.stringify(logEntry));
  }
}
