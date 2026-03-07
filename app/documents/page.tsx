'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OCRExtractor } from '@/components/document/ocr-extractor';
import { Upload, FileText, Check, Clock } from 'lucide-react';

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
        return <Check className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-amber-600 animate-spin" />;
      case 'review':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'review':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Document Processing</h1>
            <p className="text-gray-600 mt-2">Upload and process financial documents with AI-powered OCR</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        selectedDoc?.id === doc.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {getStatusIcon(doc.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          doc.status
                        )}`}
                      >
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>

                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 gap-2">
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
                  <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Document</h3>
                  <p className="text-gray-600">AI is analyzing {selectedDoc.name}</p>
                  <p className="text-sm text-gray-500 mt-4">This typically takes 1-2 minutes</p>
                </Card>
              ) : selectedDoc && selectedDoc.status === 'completed' ? (
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-900">Document Processing Complete</h3>
                      <p className="text-sm text-green-800 mt-1">
                        Extraction confidence: {(selectedDoc.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Extracted Data</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Company Name', value: 'Acme Corporation' },
                        { label: 'Tax ID', value: '12-3456789' },
                        { label: 'Annual Revenue', value: '$5,200,000' },
                        { label: 'Total Assets', value: '$8,500,000' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">{item.label}</p>
                          <p className="font-medium text-gray-900 mt-1">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                    Use This Data
                  </Button>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a document to view details</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
