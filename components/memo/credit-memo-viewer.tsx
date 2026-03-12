'use client';

import { CreditApplication, CreditMemo } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/format-utils';

interface CreditMemoViewerProps {
  application: CreditApplication;
}

export function CreditMemoViewer({ application }: CreditMemoViewerProps) {
  const generateMemo = (): CreditMemo => {
    return {
      applicationId: application.id,
      executive_summary: `${application.company.name} has submitted a credit application for $${formatCurrency(application.requestedAmount)}. Based on comprehensive financial analysis and risk assessment, the company demonstrates ${application.creditAssessment.riskRating} risk profile with a credit score of ${application.creditAssessment.creditScore}.`,
      company_overview: `${application.company.name} is a ${application.businessDetails.industry} company founded in ${application.company.foundedYear}. The company is located in ${application.company.city}, ${application.company.state} and employs approximately ${application.businessDetails.numberOfEmployees} employees. With an annual revenue of ${formatCurrency(application.businessDetails.annualRevenue)} and ${application.businessDetails.yearlyGrowth}% yearly growth, the company operates at the ${application.businessDetails.businessStage} business stage.`,
      financial_analysis: `Analysis of ${application.company.name}'s financial metrics reveals: Total Assets: ${formatCurrency(application.financialMetrics.totalAssets)}, Total Liabilities: ${formatCurrency(application.financialMetrics.totalLiabilities)}, Equity: ${formatCurrency(application.financialMetrics.equity)}. Key financial ratios include Current Ratio: ${application.financialMetrics.currentRatio.toFixed(2)}, Debt-to-Equity: ${application.financialMetrics.debtToEquityRatio.toFixed(2)}, and Profit Margin: ${(application.financialMetrics.profitMargin * 100).toFixed(1)}%. Operating cash flow of ${formatCurrency(application.financialMetrics.operatingCashFlow)} demonstrates strong liquidity position.`,
      risk_assessment: `Risk factors have been evaluated across multiple dimensions. Industry Risk: ${application.creditAssessment.riskFactors.industryRisk}, Financial Risk: ${application.creditAssessment.riskFactors.financialRisk}, Management Risk: ${application.creditAssessment.riskFactors.managementRisk}, Market Risk: ${application.creditAssessment.riskFactors.marketRisk}, and Operational Risk: ${application.creditAssessment.riskFactors.operationalRisk}. The overall risk rating is ${application.creditAssessment.riskRating.toUpperCase()}.`,
      credit_recommendation: `Based on the comprehensive analysis, the recommended credit facility is ${formatCurrency(application.creditAssessment.debtCapacity)} with an approval probability of ${(application.creditAssessment.approvalProbability * 100).toFixed(0)}%. The company demonstrates adequate financial capacity to support the requested credit facility.`,
      conclusion: application.creditAssessment.recommendation,
      generatedAt: new Date(),
    };
  };

  const memo = generateMemo();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality would generate a PDF');
  };

  const handleShare = () => {
    alert('Share functionality coming soon');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Memo Content */}
      <Card className="space-y-8 bg-white p-8">
        {/* Header */}
        <div className="border-b pb-6 text-center">
          <h1 className="text-3xl font-bold">CREDIT APPRAISAL MEMO</h1>
          <p className="mt-2 text-muted-foreground">
            Intelli-Credit AI Corporate Credit Assessment
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generated: {formatDate(memo.generatedAt)}
          </p>
        </div>

        {/* Executive Summary */}
        <section>
          <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {memo.executive_summary}
          </p>
        </section>

        {/* Company Overview */}
        <section>
          <h2 className="text-xl font-bold mb-3">Company Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Company Name
              </p>
              <p className="mt-1 font-semibold">{application.company.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Industry
              </p>
              <p className="mt-1 font-semibold">
                {application.businessDetails.industry}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Founded
              </p>
              <p className="mt-1 font-semibold">{application.company.foundedYear}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Location
              </p>
              <p className="mt-1 font-semibold">
                {application.company.city}, {application.company.state}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Employees
              </p>
              <p className="mt-1 font-semibold">
                {application.businessDetails.numberOfEmployees}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Annual Revenue
              </p>
              <p className="mt-1 font-semibold">
                {formatCurrency(application.businessDetails.annualRevenue)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {memo.company_overview}
          </p>
        </section>

        {/* Financial Analysis */}
        <section>
          <h2 className="text-xl font-bold mb-3">Financial Analysis</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-primary/5 p-3">
              <p className="text-xs font-medium text-muted-foreground">Total Assets</p>
              <p className="mt-1 font-semibold">
                {formatCurrency(application.financialMetrics.totalAssets)}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Total Equity</p>
              <p className="mt-1 font-semibold">
                {formatCurrency(application.financialMetrics.equity)}
              </p>
            </div>
            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Annual Revenue
              </p>
              <p className="mt-1 font-semibold">
                {formatCurrency(application.financialMetrics.annualRevenue)}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {memo.financial_analysis}
          </p>
        </section>

        {/* Risk Assessment */}
        <section>
          <h2 className="text-xl font-bold mb-3">Risk Assessment</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {memo.risk_assessment}
          </p>
        </section>

        {/* Credit Recommendation */}
        <section>
          <h2 className="text-xl font-bold mb-3">Credit Recommendation</h2>
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="font-semibold text-foreground">
              {memo.credit_recommendation}
            </p>
          </div>
        </section>

        {/* Conclusion */}
        <section>
          <h2 className="text-xl font-bold mb-3">Conclusion</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {memo.conclusion}
          </p>
        </section>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-xs text-muted-foreground">
          <p>This document is confidential and intended for authorized recipients only.</p>
          <p className="mt-2">© 2024 Intelli-Credit AI. All rights reserved.</p>
        </div>
      </Card>
    </div>
  );
}
