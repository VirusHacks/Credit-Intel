'use client';

import { CreditAssessment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

interface RiskAssessmentProps {
  assessment: CreditAssessment;
}

export function RiskAssessment({ assessment }: RiskAssessmentProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' };
      case 'medium':
        return { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
      case 'high':
        return { text: 'text-destructive', bg: 'bg-destructive/5', badge: 'bg-destructive/10 text-destructive' };
      default:
        return { text: 'text-muted-foreground', bg: 'bg-secondary/50', badge: 'bg-muted text-muted-foreground' };
    }
  };

  const riskFactors = [
    {
      name: 'Industry Risk',
      value: assessment.riskFactors.industryRisk,
      icon: BarChart2,
      description: 'Risk level within the industry sector',
    },
    {
      name: 'Financial Risk',
      value: assessment.riskFactors.financialRisk,
      icon: TrendingUp,
      description: 'Based on financial ratios and metrics',
    },
    {
      name: 'Management Risk',
      value: assessment.riskFactors.managementRisk,
      icon: Users,
      description: 'Quality and experience of management',
    },
    {
      name: 'Market Risk',
      value: assessment.riskFactors.marketRisk,
      icon: AlertTriangle,
      description: 'Market conditions and competition',
    },
    {
      name: 'Operational Risk',
      value: assessment.riskFactors.operationalRisk,
      icon: Zap,
      description: 'Operational efficiency and processes',
    },
  ];

  const riskColor = getRiskColor(assessment.riskRating);
  const creditScoreColor =
    assessment.creditScore >= 740
      ? { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' }
      : assessment.creditScore >= 670
        ? { text: 'text-primary', bg: 'bg-primary/5' }
        : assessment.creditScore >= 580
          ? { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20' }
          : { text: 'text-destructive', bg: 'bg-destructive/5' };

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className={`p-6 ${riskColor.bg}`}>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Overall Risk Rating</p>
            <div className={`mt-4 text-5xl font-bold ${riskColor.text}`}>
              {assessment.riskRating.toUpperCase()}
            </div>
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${riskColor.badge}`}>
              {assessment.riskRating === 'low'
                ? '✓ Low Risk'
                : assessment.riskRating === 'medium'
                  ? '⚠ Medium Risk'
                  : '✕ High Risk'}
            </span>
          </div>
        </Card>

        <Card className={`p-6 ${creditScoreColor.bg}`}>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Credit Score</p>
            <div className={`mt-4 text-5xl font-bold ${creditScoreColor.text}`}>
              {assessment.creditScore}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {assessment.creditScore >= 740
                ? 'Excellent'
                : assessment.creditScore >= 670
                  ? 'Good'
                  : assessment.creditScore >= 580
                    ? 'Fair'
                    : 'Poor'}
            </p>
          </div>
        </Card>
      </div>

      {/* Risk Factors */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Factor Analysis</h3>
        <div className="space-y-3">
          {riskFactors.map((factor) => {
            const Icon = factor.icon;
            const color = getRiskColor(factor.value);

            return (
              <div key={factor.name} className="flex items-center gap-4 rounded-lg border p-4">
                <div className={`rounded-lg p-2 ${color.bg}`}>
                  <Icon className={`h-5 w-5 ${color.text}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{factor.name}</p>
                  <p className="text-xs text-muted-foreground">{factor.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${color.badge}`}>
                  {factor.value.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recommendation */}
      <Card className="border-l-4 border-primary p-6">
        <div className="flex gap-3">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary" />
          <div>
            <h4 className="font-semibold">Credit Recommendation</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              {assessment.recommendation}
            </p>
          </div>
        </div>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Approval Probability
          </p>
          <p className="mt-2 text-2xl font-bold">
            {(assessment.approvalProbability * 100).toFixed(0)}%
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${assessment.approvalProbability * 100}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Debt Capacity
          </p>
          <p className="mt-2 text-2xl font-bold">
            ${(assessment.debtCapacity / 1000000).toFixed(2)}M
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Recommended maximum credit facility
          </p>
        </Card>
      </div>
    </div>
  );
}
