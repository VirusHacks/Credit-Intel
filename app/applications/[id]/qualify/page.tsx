'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { QualitativeForm } from '@/components/forms/qualitative-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AppSummary {
  id: string;
  companyName: string;
  pipelineStatus: string;
  qualitativeGateDone: boolean;
}

// userId is resolved from auth cookie on the server — no need to pass from client

export default function QualifyPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [app, setApp] = useState<AppSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!appId) return;
    fetch(`/api/applications/${appId}/qualify`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        // The GET endpoint returns { appId, notes } — we just need the existence check
        // The full app details would come from /api/applications/:id in production
        setApp({
          id: appId,
          companyName: 'Application ' + appId.slice(0, 8),
          pipelineStatus: 'awaiting_qualitative',
          qualitativeGateDone: false,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) {
    return (
      <DashboardLayout>
        <main className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout>
        <main className="p-6 sm:p-10">
          <div className="mx-auto max-w-lg text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Application Not Found</h1>
            <p className="mt-2 text-muted-foreground">
              No application found with ID: <code className="text-xs">{appId}</code>
            </p>
            <Link href="/applications">
              <Button className="mt-6">Back to Applications</Button>
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-3xl space-y-6 p-6 sm:p-10">
        {/* Header */}
        <div>
          <Link
            href={`/applications/${appId}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application
          </Link>
          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Qualitative Assessment</h1>
              <p className="text-sm text-muted-foreground">
                {app?.companyName} · Step 2 of the AI pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline stage banner */}
        <Card className="flex items-start gap-3 border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl rounded-xl">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
          <div>
            <p className="text-sm font-medium text-white">
              Automated analysis complete — awaiting field input
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              The AI agents have completed document extraction and signal computation.
              Your on-site observations below will be merged with the quantitative signals
              before the Reconciler generates the final 5Cs score and CAM.
            </p>
          </div>
        </Card>

        {/* Form */}
        <QualitativeForm
          appId={appId}
          onSuccess={() => {
            setTimeout(() => router.push(`/applications/${appId}`), 500);
          }}
        />
      </main>
    </DashboardLayout>
  );
}
