'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RiskAssessment } from '@/components/assessment/risk-assessment';
import { AnalysisTracker } from '@/components/analysis/analysis-tracker';
import { CreditMemoViewer } from '@/components/memo/credit-memo-viewer';
import { mockApplications } from '@/lib/mock-data';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
} from '@/lib/format-utils';
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationDetailPage() {
  const params = useParams();
  const application = mockApplications.find((app) => app.id === params.id);
  const [activeTab, setActiveTab] = useState('info');

  if (!application) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="p-6 sm:p-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Application Not Found</h1>
            <Link href="/applications">
              <Button className="mt-4">Back to Applications</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Information' },
    { id: 'financial', label: 'Financial Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'memo', label: 'Credit Memo' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/applications" className="inline-flex items-center gap-2 text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </Link>
            <h1 className="mt-2 text-3xl font-bold">{application.company.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {application.businessDetails.industry} | Application ID: {application.id}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card className="grid gap-4 p-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(application.status)}`}
            >
              {application.status
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Credit Score
            </p>
            <p className="mt-2 text-2xl font-bold">
              {application.creditAssessment.creditScore}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Requested Amount
            </p>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(application.requestedAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Applied Date
            </p>
            <p className="mt-2 font-semibold">{formatDate(application.createdAt)}</p>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Company Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Company Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Company Name
                  </p>
                  <p className="mt-1 font-semibold">{application.company.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Registration Number
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.company.registrationNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.company.registrationType}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Founded Year
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.company.foundedYear}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Location
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.company.address}, {application.company.city},{' '}
                    {application.company.state} {application.company.zipCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 font-semibold">{application.company.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 font-semibold">{application.company.email}</p>
                </div>
              </div>
            </Card>

            {/* Business Details */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Business Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Industry
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.businessDetails.industry}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Employees
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.businessDetails.numberOfEmployees}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Annual Revenue
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(
                      application.businessDetails.annualRevenue
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Business Stage
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.businessDetails.businessStage}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Yearly Growth
                  </p>
                  <p className="mt-1 font-semibold">
                    {application.businessDetails.yearlyGrowth}%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-6">Financial Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Assets
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {formatCurrency(application.financialMetrics.totalAssets)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Equity
                </p>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {formatCurrency(application.financialMetrics.equity)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Annual Revenue
                </p>
                <p className="mt-2 text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    application.financialMetrics.annualRevenue
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Net Income
                </p>
                <p className="mt-2 text-2xl font-bold text-yellow-600">
                  {formatCurrency(application.financialMetrics.netIncome)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Current Ratio
                </p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {application.financialMetrics.currentRatio.toFixed(2)}x
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Profit Margin
                </p>
                <p className="mt-2 text-2xl font-bold text-indigo-600">
                  {(application.financialMetrics.profitMargin * 100).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">
              Uploaded Documents ({application.documents.length})
            </h2>
            {application.documents.length > 0 ? (
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.size / 1000000).toFixed(1)} MB • Uploaded{' '}
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No documents uploaded</p>
            )}
          </Card>
        )}

        {activeTab === 'analysis' && (
          <AnalysisTracker analysisStatus={application.analysisStatus} />
        )}

        {activeTab === 'memo' && (
          <CreditMemoViewer application={application} />
        )}
      </main>
    </div>
  );
}
