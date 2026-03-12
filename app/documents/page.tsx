'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OCRExtractor } from '@/components/document/ocr-extractor';
import { MainNav } from '@/components/layout/main-nav';
import { PageHeader } from '@/components/ui/page-header';
import { ConfidenceBadge } from '@/components/ui/confidence-badge';
import { Upload, FileText, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'review' | 'completed';
  uploadedAt: string;
  confidence: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: '2023_Annual_Financial_Statement.pdf',
      type: 'Financial Statement',
      status: 'review',
      uploadedAt: '2024-03-15',
      confidence: 0.92,
    },
    {
      id: '2',
      name: 'Tax_Return_2023.pdf',
      type: 'Tax Return',
      status: 'processing',
      uploadedAt: '2024-03-14',
      confidence: 0,
    },
    {
      id: '3',
      name: 'Bank_Statement_Q1_2024.pdf',
      type: 'Bank Statement',
      status: 'completed',
      uploadedAt: '2024-03-10',
      confidence: 0.88,
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(documents[0]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-600 animate-spin" />;
      case 'review':
        return <FileText className="w-4 h-4 text-primary" />;
      default:
        return <Upload className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusLabel: Record<string, { text: string; cls: string }> = {
    completed: { text: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
    processing: { text: 'Processing', cls: 'bg-amber-50 text-amber-700' },
    review: { text: 'In Review', cls: 'bg-blue-50 text-blue-700' },
    pending: { text: 'Pending', cls: 'bg-secondary text-muted-foreground' },
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
        <PageHeader
          title="Document Processing"
          description="Upload and process financial documents with AI-powered OCR."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4">Recent Documents</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border-2 transition',
                      selectedDoc?.id === doc.id
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/20',
                    )}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getStatusIcon(doc.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full',
                        statusLabel[doc.status]?.cls ?? 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {statusLabel[doc.status]?.text ?? doc.status}
                    </span>
                  </button>
                ))}
              </div>

              <Button className="w-full mt-4 gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </Card>
          </div>

          {/* Document Details and OCR */}
          <div className="lg:col-span-2">
            {selectedDoc && selectedDoc.status === 'review' ? (
              <OCRExtractor
                documentName={selectedDoc.name}
                onComplete={(data) => {
                  console.log('Completed extraction:', data);
                  setSelectedDoc({
                    ...selectedDoc,
                    status: 'completed',
                  });
                }}
              />
            ) : selectedDoc && selectedDoc.status === 'processing' ? (
              <Card className="p-12 text-center">
                <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Processing Document</h3>
                <p className="text-muted-foreground">AI is analyzing {selectedDoc.name}</p>
                <p className="text-sm text-muted-foreground mt-4">This typically takes 1-2 minutes</p>
              </Card>
            ) : selectedDoc && selectedDoc.status === 'completed' ? (
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Check className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-emerald-900">Document Processing Complete</h3>
                    <p className="text-sm text-emerald-800 mt-1 flex items-center gap-2">
                      Extraction confidence: <ConfidenceBadge confidence={selectedDoc.confidence} />
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Extracted Data</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Company Name', value: 'Acme Corporation' },
                      { label: 'Tax ID', value: '12-3456789' },
                      { label: 'Annual Revenue', value: '$5,200,000' },
                      { label: 'Total Assets', value: '$8,500,000' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-secondary/50 rounded-xl">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-foreground mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full mt-6">
                  Use This Data
                </Button>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a document to view details</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
