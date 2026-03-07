'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Clock, Download, FileText } from 'lucide-react';

interface ComplianceItem {
  id: string;
  name: string;
  status: 'compliant' | 'at-risk' | 'non-compliant';
  lastChecked: string;
  nextCheck: string;
  details: string;
}

const complianceItems: ComplianceItem[] = [
  {
    id: '1',
    name: 'GDPR Data Protection',
    status: 'compliant',
    lastChecked: '2024-03-10',
    nextCheck: '2024-04-10',
    details: 'All personal data properly encrypted and access controlled',
  },
  {
    id: '2',
    name: 'SOX Audit Trail',
    status: 'compliant',
    lastChecked: '2024-03-12',
    nextCheck: '2024-04-12',
    details: 'Complete immutable audit logs maintained for all financial transactions',
  },
  {
    id: '3',
    name: 'Fair Lending Requirements',
    status: 'compliant',
    lastChecked: '2024-03-08',
    nextCheck: '2024-04-08',
    details: 'No discriminatory patterns detected in credit decisions',
  },
  {
    id: '4',
    name: 'Data Retention Policies',
    status: 'at-risk',
    lastChecked: '2024-03-15',
    nextCheck: '2024-03-20',
    details: 'Some legacy data exceeds retention period - scheduled for purge',
  },
  {
    id: '5',
    name: 'Access Control',
    status: 'compliant',
    lastChecked: '2024-03-14',
    nextCheck: '2024-04-14',
    details: 'Role-based access control properly configured and monitored',
  },
  {
    id: '6',
    name: 'AI Model Transparency',
    status: 'compliant',
    lastChecked: '2024-03-13',
    nextCheck: '2024-04-13',
    details: 'Model decisions are explainable and documented',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'at-risk':
      return <AlertCircle className="w-5 h-5 text-amber-600" />;
    default:
      return <AlertCircle className="w-5 h-5 text-red-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'compliant':
      return 'bg-green-50 border-green-200';
    case 'at-risk':
      return 'bg-amber-50 border-amber-200';
    default:
      return 'bg-red-50 border-red-200';
  }
};

export function ComplianceReport() {
  const compliantCount = complianceItems.filter((item) => item.status === 'compliant').length;
  const atRiskCount = complianceItems.filter((item) => item.status === 'at-risk').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliant Controls</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{compliantCount}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At Risk</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{atRiskCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-amber-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Score</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {Math.round((compliantCount / complianceItems.length) * 100)}%
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-600 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Compliance Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Control Status</h3>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Generate Report
          </Button>
        </div>

        {complianceItems.map((item) => (
          <Card key={item.id} className={`p-4 border-l-4 ${getStatusColor(item.status)}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-700 mt-1">{item.details}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last checked: {item.lastChecked}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next check: {item.nextCheck}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  item.status === 'compliant'
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'at-risk'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.status === 'compliant'
                  ? 'Compliant'
                  : item.status === 'at-risk'
                  ? 'At Risk'
                  : 'Non-Compliant'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Generation */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Generate Compliance Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create detailed compliance documentation for regulatory review
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <FileText className="w-4 h-4" />
            Generate PDF Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
