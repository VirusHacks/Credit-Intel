'use client';

import { useState } from 'react';
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
import { ChevronRight, Check } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleSubmit = () => {
    console.log('Submitting application:', formData);
    alert('Application submitted successfully!');
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
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                    index + 1 < currentStep
                      ? 'border-green-600 bg-green-600 text-white'
                      : index + 1 === currentStep
                        ? 'border-blue-600 bg-blue-600 text-white'
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
                  className={`mx-2 h-1 flex-1 transition-all ${
                    index + 1 < currentStep ? 'bg-green-600' : 'bg-muted'
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
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        <div className="flex gap-4">
          {currentStep === STEPS.length ? (
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
            >
              Submit Application
            </Button>
          ) : (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
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
