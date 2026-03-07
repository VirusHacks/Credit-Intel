export interface AuditLog {
  id: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

class AuditLogger {
  private logs: AuditLog[] = [];

  log(audit: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...audit,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };

    this.logs.push(log);

    // In production, this would be saved to the database
    console.log('[Audit]', log);

    return log;
  }

  logApplicationCreated(userId: string, applicationId: string, data: Record<string, unknown>) {
    return this.log({
      userId,
      entityType: 'application',
      entityId: applicationId,
      action: 'created',
      changes: data,
    });
  }

  logApplicationUpdated(
    userId: string,
    applicationId: string,
    changes: Record<string, unknown>
  ) {
    return this.log({
      userId,
      entityType: 'application',
      entityId: applicationId,
      action: 'updated',
      changes,
    });
  }

  logDocumentUploaded(userId: string, applicationId: string, documentId: string) {
    return this.log({
      userId,
      entityType: 'document',
      entityId: documentId,
      action: 'uploaded',
      changes: { applicationId },
    });
  }

  logAssessmentCreated(
    userId: string,
    applicationId: string,
    assessmentId: string,
    data: Record<string, unknown>
  ) {
    return this.log({
      userId,
      entityType: 'assessment',
      entityId: assessmentId,
      action: 'created',
      changes: data,
    });
  }

  logUserLogin(userId: string, email: string) {
    return this.log({
      userId,
      entityType: 'user',
      entityId: userId,
      action: 'login',
      changes: { email },
    });
  }

  logUserLogout(userId: string) {
    return this.log({
      userId,
      entityType: 'user',
      entityId: userId,
      action: 'logout',
    });
  }

  logAccessDenied(userId: string, resource: string, reason: string) {
    return this.log({
      userId,
      entityType: 'access',
      entityId: resource,
      action: 'denied',
      changes: { reason },
    });
  }

  getLogs(filter?: { entityType?: string; userId?: string; action?: string }): AuditLog[] {
    if (!filter) return this.logs;

    return this.logs.filter((log) => {
      if (filter.entityType && log.entityType !== filter.entityType) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.action && log.action !== filter.action) return false;
      return true;
    });
  }

  getRecentLogs(limit: number = 20): AuditLog[] {
    return this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }
}

export const auditLogger = new AuditLogger();
