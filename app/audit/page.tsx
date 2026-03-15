'use client';

import { AuditLogViewer } from '@/components/compliance/audit-log-viewer';
import { ComplianceReport } from '@/components/compliance/compliance-report';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AuditPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Audit &amp; Compliance
        </h1>

        <div className="relative flex flex-col gap-6 p-6">
          <p className="text-sm text-white/40">Monitor system activity and manage regulatory compliance.</p>

          <Tabs defaultValue="compliance" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 backdrop-blur-md shadow-xl rounded-xl p-1 gap-1">
              <TabsTrigger
                value="compliance"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Compliance Status
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/40 rounded-md flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compliance" className="space-y-6 mt-6">
              <ComplianceReport />
            </TabsContent>

            <TabsContent value="audit" className="space-y-6 mt-6">
              <AuditLogViewer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
