'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/format-utils';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ─── Document type options (Indian context) ────────────────────────────────
const DOCUMENT_TYPES = [
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'gst_return', label: 'GST Return (GSTR-3B / 2A)' },
  { value: 'itr', label: 'ITR (Income Tax Return)' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'cibil_report', label: 'CIBIL Commercial Report' },
  { value: 'financial_statement', label: 'Financial Statement / Balance Sheet' },
  { value: 'sanction_letter', label: 'Sanction Letter' },
  { value: 'other', label: 'Other' },
] as const;

/** Auto-guess document type from filename keywords */
function guessDocType(filename: string): string {
  const n = filename.toLowerCase();
  if (n.includes('bank') || n.includes('statement')) return 'bank_statement';
  if (n.includes('gst') || n.includes('gstr')) return 'gst_return';
  if (n.includes('itr') || n.includes('income tax')) return 'itr';
  if (n.includes('cibil') || n.includes('cmr')) return 'cibil_report';
  if (n.includes('annual') || n.includes('ar ') || n.includes('_ar_')) return 'annual_report';
  if (n.includes('balance') || n.includes('financial') || n.includes('p&l')) return 'financial_statement';
  if (n.includes('sanction')) return 'sanction_letter';
  return 'other';
}

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface FileItem {
  localId: string;
  file: File;
  documentType: string;
  status: UploadStatus;
  errorMsg?: string;
  blobUrl?: string;
  documentId?: string;
}

export interface UploadedDocResult {
  documentId?: string;
  blobUrl: string;
  fileName: string;
  fileSize: number;
  documentType: string;
}

interface DocumentUploaderProps {
  applicationId?: string;
  onFilesChange?: (results: UploadedDocResult[]) => void;
  maxFileSize?: number;
}

export function DocumentUploader({
  applicationId,
  onFilesChange,
  maxFileSize = 50 * 1024 * 1024,
}: DocumentUploaderProps) {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (rawFiles: File[]) => {
    const newItems: FileItem[] = [];
    for (const f of rawFiles) {
      if (f.size > maxFileSize) {
        alert(`"${f.name}" is too large. Max size is ${formatFileSize(maxFileSize)}`);
        continue;
      }
      if (f.type !== 'application/pdf') {
        alert(`Only PDF files are allowed. Skipping: ${f.name}`);
        continue;
      }
      newItems.push({
        localId: Math.random().toString(36).slice(2),
        file: f,
        documentType: guessDocType(f.name),
        status: 'pending',
      });
    }
    setFileItems((prev) => [...prev, ...newItems]);
  };

  const updateDocType = (localId: string, documentType: string) => {
    setFileItems((prev) =>
      prev.map((item) => item.localId === localId ? { ...item, documentType } : item),
    );
  };

  const removeFile = (localId: string) => {
    const updated = fileItems.filter((f) => f.localId !== localId);
    setFileItems(updated);
    notifyParent(updated);
  };

  const notifyParent = (items: FileItem[]) => {
    const results: UploadedDocResult[] = items
      .filter((i) => i.status === 'done' && i.blobUrl)
      .map((i) => ({
        documentId: i.documentId,
        blobUrl: i.blobUrl!,
        fileName: i.file.name,
        fileSize: i.file.size,
        documentType: i.documentType,
      }));
    onFilesChange?.(results);
  };

  const uploadSingle = async (item: FileItem): Promise<FileItem> => {
    const form = new FormData();
    form.append('file', item.file);
    form.append('documentType', item.documentType);
    if (applicationId) form.append('applicationId', applicationId);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Upload failed' }))) as { error: string };
        return { ...item, status: 'error', errorMsg: err.error };
      }
      const data = (await res.json()) as { blobUrl: string; documentId?: string };
      return { ...item, status: 'done', blobUrl: data.blobUrl, documentId: data.documentId };
    } catch {
      return { ...item, status: 'error', errorMsg: 'Network error — check connection' };
    }
  };

  const uploadAll = async () => {
    const pending = fileItems.filter((i) => i.status === 'pending');
    if (!pending.length) return;

    // Mark all pending as uploading immediately
    setFileItems((prev) =>
      prev.map((i) => (i.status === 'pending' ? { ...i, status: 'uploading' as const } : i)),
    );

    const results = await Promise.all(pending.map(uploadSingle));

    const nextItems = fileItems.map((i) => {
      const r = results.find((r) => r.localId === i.localId);
      return r ?? i;
    });
    setFileItems(nextItems);
    notifyParent(nextItems);
  };

  const pendingCount = fileItems.filter((i) => i.status === 'pending').length;
  const uploadingCount = fileItems.filter((i) => i.status === 'uploading').length;

  return (
    <div className="space-y-4">
      {/* ── Drop Zone ──────────────────────────────────────────────────── */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">Drag PDF files here</h3>
        <p className="text-xs text-muted-foreground">
          or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:underline"
          >
            click to select
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF only · Max {formatFileSize(maxFileSize)}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {/* ── File list ─────────────────────────────────────────────────── */}
      {fileItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {fileItems.length} file{fileItems.length !== 1 ? 's' : ''} selected
            </h4>
            {pendingCount > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={uploadAll}
                disabled={uploadingCount > 0}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {uploadingCount > 0 ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {fileItems.map((item) => (
              <div
                key={item.localId}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${item.status === 'error'
                  ? 'border-red-200 bg-red-50'
                  : item.status === 'done'
                    ? 'border-green-200 bg-green-50'
                    : 'bg-card'
                  }`}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {item.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {item.status === 'pending' && (
                    <File className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </p>
                  {item.status === 'error' && (
                    <p className="text-xs text-red-500">{item.errorMsg}</p>
                  )}
                </div>

                {/* Document type selector */}
                <select
                  value={item.documentType}
                  onChange={(e) => updateDocType(item.localId, e.target.value)}
                  disabled={item.status === 'uploading' || item.status === 'done'}
                  className="rounded border bg-background px-2 py-1 text-xs"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {/* Remove button */}
                {item.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={() => removeFile(item.localId)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
