'use client';

import { Card } from '@/components/ui/card';
import { CreditApplication } from '@/lib/types';
import { CheckCircle2, Clock, TrendingUp, XCircle } from 'lucide-react';

interface OverviewCardsProps {
  applications: CreditApplication[];
}

export function OverviewCards({ applications }: OverviewCardsProps) {
  const approved = applications.filter(
    (app) => app.status === 'approved'
  ).length;
  const rejected = applications.filter(
    (app) => app.status === 'rejected'
  ).length;
  const pending = applications.filter(
    (app) => app.status === 'under_review' || app.status === 'submitted'
  ).length;

  const avgCreditScore =
    applications.length > 0
      ? Math.round(
          applications.reduce(
            (sum, app) => sum + app.creditAssessment.creditScore,
            0
          ) / applications.length
        )
      : 0;

  const cards = [
    {
      title: 'Total Applications',
      value: applications.length.toString(),
      icon: TrendingUp,
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Approved',
      value: approved.toString(),
      icon: CheckCircle2,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Under Review',
      value: pending.toString(),
      icon: Clock,
      color: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Rejected',
      value: rejected.toString(),
      icon: XCircle,
      color: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      title: 'Avg Credit Score',
      value: avgCreditScore.toString(),
      icon: TrendingUp,
      color: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`p-6 ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className={`mt-2 text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${card.textColor}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
