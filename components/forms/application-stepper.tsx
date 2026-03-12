'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  StepCompany,
  StepBusiness,
  StepDocuments,
  StepBanking,
  StepReview,
} from './form-steps';
import type { UploadedDocResult } from './document-uploader';
import { ChevronRight, Check, Loader2 } from 'lucide-react';

interface FormData {
  // Company Info
  companyName: string;
  registrationNumber: string;
  registrationType: string;
  foundedYear: string;
  location: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  website?: string;

  // Business Details
  industry: string;
  numberOfEmployees: string;
  annualRevenue: string;
  businessStage: string;
  yearlyGrowth: string;
  mainProducts: string;

  // Documents
  documents: UploadedDocResult[];

  // Banking
  bankName: string;
  accountNumber: string;
  accountType: string;
  yearsWithBank: string;

  // Requested amount
  requestedAmount: string;
}

const STEPS = [
  { id: 1, title: 'Company Info' },
  { id: 2, title: 'Business Details' },
  { id: 3, title: 'Documents' },
  { id: 4, title: 'Banking Info' },
  { id: 5, title: 'Review' },
];

export function ApplicationStepper() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    registrationNumber: '',
    registrationType: 'C-Corporation',
    foundedYear: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    email: '',
    website: '',
    industry: '',
    numberOfEmployees: '',
    annualRevenue: '',
    businessStage: 'Growth',
    yearlyGrowth: '',
    mainProducts: '',
    documents: [],
    bankName: '',
    accountNumber: '',
    accountType: 'Business Checking',
    yearsWithBank: '',
    requestedAmount: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          industry: formData.industry || undefined,
          cin: formData.registrationNumber || undefined,
          requestedAmountInr: formData.requestedAmount || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          // Pass uploaded docs so server can create DB records before starting pipeline
          uploadedDocuments: formData.documents.map((d) => ({
            blobUrl: d.blobUrl,
            fileName: d.fileName,
            fileSize: d.fileSize,
            documentType: d.documentType,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Submission failed');
      }
      const { id, companyName } = await res.json() as { id: string; companyName: string };

      // Explicitly kick off the pipeline via the dedicated route (reliable, dedicated handler)
      // Don't await — this is intentionally async so we can redirect immediately
      fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: id, companyName }),
      }).catch(() => {/* detail page will auto-trigger as fallback */ });

      // Navigate to detail page — it will also auto-trigger if pipeline didn't start
      router.push(`/applications/${id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData({ ...formData, ...data });
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${index + 1 < currentStep
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : index + 1 === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground bg-background text-muted-foreground'
                    }`}
                >
                  {index + 1 < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="mt-2 text-xs font-medium sm:text-sm">
                  {step.title}
                </span>
              </div>
              {index + 1 < STEPS.length && (
                <div
                  className={`mx-2 h-1 flex-1 transition-all ${index + 1 < currentStep ? 'bg-emerald-600' : 'bg-muted'
                    }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="p-8">
        {currentStep === 1 && (
          <StepCompany formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 2 && (
          <StepBusiness formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 3 && (
          <StepDocuments formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 4 && (
          <StepBanking formData={formData} updateFormData={updateFormData} />
        )}
        {currentStep === 5 && (
          <StepReview formData={formData} updateFormData={updateFormData} />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || submitting}
        >
          Previous
        </Button>
        <div className="flex flex-col items-end gap-2">
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
          {currentStep === STEPS.length ? (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Starting Analysis…</>
              ) : (
                'Submit & Start Analysis'
              )}
            </Button>
          ) : (
            <Button
              className="gap-2"
              onClick={handleNext}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
