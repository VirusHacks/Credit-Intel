'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { OCRExtractor } from '@/components/document/ocr-extractor';
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
    { id: '1', name: '2023_Annual_Financial_Statement.pdf', type: 'Financial Statement', status: 'review', uploadedAt: '2024-03-15', confidence: 0.92 },
    { id: '2', name: 'Tax_Return_2023.pdf', type: 'Tax Return', status: 'processing', uploadedAt: '2024-03-14', confidence: 0 },
    { id: '3', name: 'Bank_Statement_Q1_2024.pdf', type: 'Bank Statement', status: 'completed', uploadedAt: '2024-03-10', confidence: 0.88 },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(documents[0]);

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'completed': return <span className="text-xs font-bold">✓</span>;
      case 'processing': return <Clock className="w-3 h-3 animate-spin" />
      case 'review': return <span className="text-xs">→</span>;
      default: return <span className="text-xs text-white/30">○</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Document Processing
        </h1>

        <div className="relative flex flex-col gap-6 p-6">
          <p className="text-sm text-white/40">Upload and process financial documents with AI-powered OCR.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-4">
                <h3 className="font-semibold text-white mb-4 text-base">Recent Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        selectedDoc?.id === doc.id
                          ? 'border-white/20 bg-white/5'
                          : 'border-white/10 hover:border-white/10 hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="mt-0.5 text-white/60">{getStatusSymbol(doc.status)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">{doc.name}</p>
                          <p className="text-xs text-white/40">{doc.type}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>

                <Button className="w-full mt-4 gap-2 bg-white text-black hover:bg-white/90">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
              </div>
            </div>

            {/* Document Details and OCR */}
            <div className="lg:col-span-2">
              {selectedDoc && selectedDoc.status === 'review' ? (
                <OCRExtractor
                  documentName={selectedDoc.name}
                  onComplete={(data) => {
                    console.log('Completed extraction:', data);
                    setSelectedDoc({ ...selectedDoc, status: 'completed' });
                  }}
                />
              ) : selectedDoc && selectedDoc.status === 'processing' ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl py-20 text-center shadow-2xl">
                  <Clock className="w-10 h-10 text-white/20 animate-spin" />
                  <div>
                    <p className="text-base font-semibold text-white">Processing Document</p>
                    <p className="mt-1 text-sm text-white/40">AI is analyzing {selectedDoc.name}</p>
                    <p className="mt-2 text-xs text-white/30">This typically takes 1–2 minutes</p>
                  </div>
                </div>
              ) : selectedDoc && selectedDoc.status === 'completed' ? (
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
                    <span className="text-xl font-bold">✓</span>
                    <div>
                      <p className="font-semibold text-white">Document Processing Complete</p>
                      <p className="text-sm text-white/40 mt-1 flex items-center gap-2">
                        Extraction confidence: <ConfidenceBadge confidence={selectedDoc.confidence} />
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm uppercase tracking-widest text-white/30">Extracted Data</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Company Name', value: 'Acme Corporation' },
                        { label: 'Tax ID', value: '12-3456789' },
                        { label: 'Annual Revenue', value: '$5,200,000' },
                        { label: 'Total Assets', value: '$8,500,000' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
                          <p className="text-xs text-white/40">{item.label}</p>
                          <p className="font-medium text-white mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-white text-black hover:bg-white/90">
                    Use This Data
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl py-20 text-center shadow-2xl">
                  <FileText className="w-10 h-10 text-white/20" />
                  <p className="text-sm text-white/40">Select a document to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
