'use client';

import { AuditLogViewer } from '@/components/compliance/audit-log-viewer';
import { ComplianceReport } from '@/components/compliance/compliance-report';
import { MainNav } from '@/components/layout/main-nav';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Clock } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
        <PageHeader
          title="Audit & Compliance"
          description="Monitor system activity and manage regulatory compliance."
        />

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
      </main>
    </div>
  );
}
