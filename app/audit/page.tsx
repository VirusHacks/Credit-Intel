'use client';

import { AuditLogViewer } from '@/components/compliance/audit-log-viewer';
import { ComplianceReport } from '@/components/compliance/compliance-report';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AuditPage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              Audit & Compliance
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor system activity and manage regulatory compliance
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="compliance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="compliance" className="gap-2">
                <ShieldCheck className="w-4 h-4" />
                Compliance Status
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <Clock className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compliance" className="space-y-6">
              <ComplianceReport />
            </TabsContent>

            <TabsContent value="audit" className="space-y-6">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
