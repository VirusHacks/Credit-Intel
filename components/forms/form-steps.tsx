'use client';

import { DocumentUploader, type UploadedDocResult } from './document-uploader';

interface FormData {
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
  industry: string;
  numberOfEmployees: string;
  annualRevenue: string;
  businessStage: string;
  yearlyGrowth: string;
  mainProducts: string;
  documents: UploadedDocResult[];
  bankName: string;
  accountNumber: string;
  accountType: string;
  yearsWithBank: string;
  requestedAmount: string;
}

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export function StepCompany({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Company Information</h2>
        <p className="mt-1 text-muted-foreground">
          Please provide details about your company
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Company Name *</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => updateFormData({ companyName: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="Enter company name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Registration Number *</label>
          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) =>
              updateFormData({ registrationNumber: e.target.value })
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="e.g., TX-2019-001234"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Registration Type *</label>
          <select
            value={formData.registrationType}
            onChange={(e) =>
              updateFormData({ registrationType: e.target.value })
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option>C-Corporation</option>
            <option>S-Corporation</option>
            <option>LLC</option>
            <option>Partnership</option>
            <option>Sole Proprietorship</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Founded Year *</label>
          <input
            type="number"
            value={formData.foundedYear}
            onChange={(e) => updateFormData({ foundedYear: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="2020"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Address *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="123 Main Street"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="Austin"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">State *</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => updateFormData({ state: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="TX"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">ZIP Code *</label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e) => updateFormData({ zipCode: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="78701"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone Number *</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="info@company.com"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  );
}

export function StepBusiness({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Details</h2>
        <p className="mt-1 text-muted-foreground">
          Tell us about your business and operations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Industry *</label>
          <select
            value={formData.industry}
            onChange={(e) => updateFormData({ industry: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="">Select Industry</option>
            <option>Technology</option>
            <option>Manufacturing</option>
            <option>Retail</option>
            <option>Healthcare</option>
            <option>Finance</option>
            <option>Energy</option>
            <option>Real Estate</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Number of Employees *
          </label>
          <input
            type="number"
            value={formData.numberOfEmployees}
            onChange={(e) =>
              updateFormData({ numberOfEmployees: e.target.value })
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Annual Revenue *</label>
          <input
            type="number"
            value={formData.annualRevenue}
            onChange={(e) => updateFormData({ annualRevenue: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="1000000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Business Stage *</label>
          <select
            value={formData.businessStage}
            onChange={(e) => updateFormData({ businessStage: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option>Early Stage</option>
            <option>Growth</option>
            <option>Mature</option>
            <option>Decline</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Yearly Growth Rate (%) *
          </label>
          <input
            type="number"
            value={formData.yearlyGrowth}
            onChange={(e) => updateFormData({ yearlyGrowth: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="15"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Main Products/Services *</label>
          <textarea
            value={formData.mainProducts}
            onChange={(e) => updateFormData({ mainProducts: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="Describe your main products or services"
            rows={3}
            required
          />
        </div>
      </div>
    </div>
  );
}

export function StepDocuments({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Documents</h2>
        <p className="mt-1 text-muted-foreground">
          Upload PDFs — the AI pipeline will automatically detect digital vs scanned documents
        </p>
      </div>

      <DocumentUploader
        onFilesChange={(results) => updateFormData({ documents: results })}
      />

      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">Required Documents (Indian Corporate Lending):</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>Bank Statements — last 12 months (all operating accounts)</li>
          <li>GST Returns — GSTR-3B &amp; GSTR-2A (last 2 years)</li>
          <li>ITR — Form ITR-6 / ITR-5 (last 2 years)</li>
          <li>Balance Sheet &amp; P&amp;L — CA-certified (last 2 years)</li>
          <li>CIBIL Commercial Report (CMR)</li>
          <li>Annual Report (if listed / available)</li>
          <li>Existing Sanction Letters from other lenders</li>
        </ul>
      </div>
    </div>
  );
}

export function StepBanking({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banking Information</h2>
        <p className="mt-1 text-muted-foreground">
          Provide your banking details for verification
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Bank Name *</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => updateFormData({ bankName: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="First National Bank"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Account Number *</label>
          <input
            type="password"
            value={formData.accountNumber}
            onChange={(e) => updateFormData({ accountNumber: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Account Type *</label>
          <select
            value={formData.accountType}
            onChange={(e) => updateFormData({ accountType: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          >
            <option>Business Checking</option>
            <option>Business Savings</option>
            <option>Money Market</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Years with Bank *</label>
          <input
            type="number"
            value={formData.yearsWithBank}
            onChange={(e) => updateFormData({ yearsWithBank: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="5"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Requested Loan Amount *</label>
          <input
            type="number"
            value={formData.requestedAmount}
            onChange={(e) =>
              updateFormData({ requestedAmount: e.target.value })
            }
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            placeholder="500000"
            required
          />
        </div>
      </div>
    </div>
  );
}

export function StepReview({ formData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review Application</h2>
        <p className="mt-1 text-muted-foreground">
          Please review all information before submitting
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold">Company Information</h3>
          <div className="mt-3 space-y-1 text-sm">
            <p>
              <span className="font-medium">Name:</span> {formData.companyName}
            </p>
            <p>
              <span className="font-medium">Registration:</span>{' '}
              {formData.registrationNumber}
            </p>
            <p>
              <span className="font-medium">Type:</span> {formData.registrationType}
            </p>
            <p>
              <span className="font-medium">Founded:</span> {formData.foundedYear}
            </p>
            <p>
              <span className="font-medium">Location:</span> {formData.city},{' '}
              {formData.state}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold">Business Details</h3>
          <div className="mt-3 space-y-1 text-sm">
            <p>
              <span className="font-medium">Industry:</span> {formData.industry}
            </p>
            <p>
              <span className="font-medium">Employees:</span>{' '}
              {formData.numberOfEmployees}
            </p>
            <p>
              <span className="font-medium">Revenue:</span> $
              {formData.annualRevenue}
            </p>
            <p>
              <span className="font-medium">Growth:</span> {formData.yearlyGrowth}%
            </p>
            <p>
              <span className="font-medium">Stage:</span> {formData.businessStage}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold">Banking Information</h3>
          <div className="mt-3 space-y-1 text-sm">
            <p>
              <span className="font-medium">Bank:</span> {formData.bankName}
            </p>
            <p>
              <span className="font-medium">Type:</span> {formData.accountType}
            </p>
            <p>
              <span className="font-medium">Years:</span> {formData.yearsWithBank}
            </p>
            <p>
              <span className="font-medium">Requested:</span> $
              {formData.requestedAmount}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-semibold">Documents</h3>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-medium">Files Uploaded: {formData.documents.length}</p>
            <ul className="mt-2 space-y-1">
              {formData.documents.map((doc) => (
                <li key={doc.blobUrl} className="text-xs">
                  • {doc.fileName}{' '}
                  <span className="text-muted-foreground">({doc.documentType.replace('_', ' ')})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
        <p className="text-sm text-green-900">
          ✓ By submitting this application, you confirm that all information
          provided is accurate and complete.
        </p>
      </div>
    </div>
  );
}
