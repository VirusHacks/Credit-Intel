'use client';

import { MainNav } from '@/components/layout/main-nav';
import { ApplicationStepper } from '@/components/forms/application-stepper';

export default function NewApplicationPage() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="space-y-8 p-6 sm:p-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Application</h1>
          <p className="mt-2 text-muted-foreground">
            Complete all steps to submit a credit application
          </p>
        </div>

        <ApplicationStepper />
      </main>
    </div>
  );
}
