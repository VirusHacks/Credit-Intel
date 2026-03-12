'use client';

import { MainNav } from '@/components/layout/main-nav';
import { ApplicationStepper } from '@/components/forms/application-stepper';
import { PageHeader } from '@/components/ui/page-header';

export default function NewApplicationPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <PageHeader
          title="New Application"
          description="Complete all steps to submit a credit application."
        />
        <ApplicationStepper />
      </main>
    </div>
  );
}
