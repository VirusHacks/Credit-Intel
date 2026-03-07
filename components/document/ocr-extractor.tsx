'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Edit2 } from 'lucide-react';

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  isConfirmed: boolean;
}

interface OCRExtractorProps {
  documentName: string;
  onComplete?: (data: ExtractedField[]) => void;
}

export function OCRExtractor({ documentName, onComplete }: OCRExtractorProps) {
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([
    { label: 'Company Name', value: 'Acme Corporation', confidence: 0.95, isConfirmed: false },
    { label: 'Tax ID', value: '12-3456789', confidence: 0.89, isConfirmed: false },
    { label: 'Annual Revenue', value: '$5,200,000', confidence: 0.92, isConfirmed: false },
    { label: 'Total Assets', value: '$8,500,000', confidence: 0.88, isConfirmed: false },
    { label: 'Total Liabilities', value: '$3,200,000', confidence: 0.91, isConfirmed: false },
    { label: 'Net Income', value: '$750,000', confidence: 0.85, isConfirmed: false },
  ]);

  const [editingField, setEditingField] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleConfirm = (index: number) => {
    const updated = [...extractedFields];
    updated[index].isConfirmed = true;
    setExtractedFields(updated);
  };

  const handleEdit = (index: number) => {
    setEditingField(index);
    setEditValue(extractedFields[index].value);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...extractedFields];
    updated[index].value = editValue;
    updated[index].isConfirmed = true;
    setExtractedFields(updated);
    setEditingField(null);
  };

  const allConfirmed = extractedFields.every((f) => f.isConfirmed);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.75) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">OCR Extraction Review</h3>
        <p className="text-sm text-gray-600 mt-1">Document: {documentName}</p>
      </div>

      <div className="space-y-3 mb-6">
        {extractedFields.map((field, index) => (
          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900">{field.label}</p>
                <span className={`text-xs font-semibold ${getConfidenceColor(field.confidence)}`}>
                  {(field.confidence * 100).toFixed(0)}% confident
                </span>
              </div>

              {editingField === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <p className="text-gray-700">{field.value}</p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {editingField === index ? (
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(index)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(index)}
                    className="gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant={field.isConfirmed ? 'default' : 'outline'}
                    onClick={() => handleConfirm(index)}
                    className={field.isConfirmed ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {field.isConfirmed ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Confirmed
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {!allConfirmed && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Please confirm all fields</p>
            <p className="text-sm text-amber-800 mt-1">
              Review and confirm the extracted data before proceeding
            </p>
          </div>
        </div>
      )}

      {allConfirmed && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">All fields confirmed and ready for analysis</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => onComplete?.(extractedFields)}
          disabled={!allConfirmed}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Complete Review
        </Button>
      </div>
    </Card>
  );
}
