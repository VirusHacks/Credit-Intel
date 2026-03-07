'use server';

import { auditLogger } from './audit-logger';

interface ApplicationData {
  companyName: string;
  registrationNumber: string;
  industry: string;
  annualRevenue: number;
  numberOfEmployees: number;
}

interface AssessmentData {
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  rationale: string;
}

// Mock implementation - in production, this would interact with database
const applications = new Map<string, ApplicationData>();
const assessments = new Map<string, AssessmentData>();

export async function createApplication(userId: string, data: ApplicationData) {
  try {
    const applicationId = `APP-${Date.now()}`;
    applications.set(applicationId, data);

    // Log the action
    auditLogger.logApplicationCreated(userId, applicationId, data);

    return {
      success: true,
      applicationId,
      message: 'Application created successfully',
    };
  } catch (error) {
    console.error('Error creating application:', error);
    return {
      success: false,
      error: 'Failed to create application',
    };
  }
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  data: Partial<ApplicationData>
) {
  try {
    const existing = applications.get(applicationId);
    if (!existing) {
      return { success: false, error: 'Application not found' };
    }

    const updated = { ...existing, ...data };
    applications.set(applicationId, updated);

    // Log the action
    auditLogger.logApplicationUpdated(userId, applicationId, data);

    return {
      success: true,
      message: 'Application updated successfully',
    };
  } catch (error) {
    console.error('Error updating application:', error);
    return {
      success: false,
      error: 'Failed to update application',
    };
  }
}

export async function getApplication(applicationId: string) {
  try {
    const app = applications.get(applicationId);
    if (!app) {
      return { success: false, error: 'Application not found' };
    }

    return {
      success: true,
      data: app,
    };
  } catch (error) {
    console.error('Error fetching application:', error);
    return {
      success: false,
      error: 'Failed to fetch application',
    };
  }
}

export async function createAssessment(
  userId: string,
  applicationId: string,
  data: AssessmentData
) {
  try {
    const assessmentId = `ASS-${Date.now()}`;
    assessments.set(assessmentId, data);

    // Log the action
    auditLogger.logAssessmentCreated(userId, applicationId, assessmentId, data);

    return {
      success: true,
      assessmentId,
      message: 'Assessment created successfully',
    };
  } catch (error) {
    console.error('Error creating assessment:', error);
    return {
      success: false,
      error: 'Failed to create assessment',
    };
  }
}

export async function uploadDocument(
  userId: string,
  applicationId: string,
  fileName: string,
  fileSize: number
) {
  try {
    const documentId = `DOC-${Date.now()}`;

    // Log the action
    auditLogger.logDocumentUploaded(userId, applicationId, documentId);

    return {
      success: true,
      documentId,
      message: 'Document uploaded successfully',
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: 'Failed to upload document',
    };
  }
}

export async function recordLogin(userId: string, email: string) {
  try {
    auditLogger.logUserLogin(userId, email);

    return {
      success: true,
      message: 'Login recorded',
    };
  } catch (error) {
    console.error('Error recording login:', error);
    return {
      success: false,
      error: 'Failed to record login',
    };
  }
}

export async function recordLogout(userId: string) {
  try {
    auditLogger.logUserLogout(userId);

    return {
      success: true,
      message: 'Logout recorded',
    };
  } catch (error) {
    console.error('Error recording logout:', error);
    return {
      success: false,
      error: 'Failed to record logout',
    };
  }
}

export async function getAuditLogs(
  filter?: { entityType?: string; userId?: string; action?: string },
  limit?: number
) {
  try {
    const logs = limit ? auditLogger.getRecentLogs(limit) : auditLogger.getLogs(filter);

    return {
      success: true,
      logs,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      success: false,
      error: 'Failed to fetch audit logs',
    };
  }
}
