'use client';

import { AnalysisStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

interface AnalysisTrackerProps {
  analysisStatus: AnalysisStatus[];
}

export function AnalysisTracker({ analysisStatus }: AnalysisTrackerProps) {
  const getStepIcon = (step: string) => {
    switch (step) {
      case 'document_verification':
        return FileText;
      case 'financial_analysis':
        return BarChart3;
      case 'risk_assessment':
        return AlertTriangle;
      case 'credit_scoring':
        return TrendingUp;
      case 'report_generation':
        return FileCheck;
      default:
        return Clock;
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'document_verification':
        return 'Document Verification';
      case 'financial_analysis':
        return 'Financial Analysis';
      case 'risk_assessment':
        return 'Risk Assessment';
      case 'credit_scoring':
        return 'Credit Scoring';
      case 'report_generation':
        return 'Report Generation';
      default:
        return step;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/30 animate-pulse';
      case 'pending':
        return 'bg-muted text-muted-foreground border-border';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string, step: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'in_progress':
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'pending':
        return <Clock className="h-6 w-6" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
    }
  };

  const currentStep = analysisStatus.findIndex(
    (s) => s.status === 'in_progress' || s.status === 'pending'
  );
  const progressPercentage = Math.round(
    ((analysisStatus.filter((s) => s.status === 'completed').length) /
      analysisStatus.length) *
      100
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Analysis Progress</h3>
          <span className="text-2xl font-bold text-primary tabular-nums">{progressPercentage}%</span>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {analysisStatus.map((item, index) => {
          const Icon = getStepIcon(item.step);
          const StatusIcon = getStatusIcon(item.status, item.step);

          return (
            <div key={item.step} className="flex items-center gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`rounded-full border-2 p-2 ${getStatusColor(item.status)}`}>
                  {StatusIcon}
                </div>
                {index < analysisStatus.length - 1 && (
                  <div
                    className={`h-12 w-1 ${
                      analysisStatus[index + 1].status === 'completed'
                        ? 'bg-emerald-400'
                        : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{getStepTitle(item.step)}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.status === 'completed'
                        ? `Completed on ${new Date(item.completedAt || '').toLocaleDateString()}`
                        : item.status === 'in_progress'
                          ? `${item.estimatedTimeRemaining || 0} hours remaining`
                          : 'Pending'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status
                      .split('_')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
