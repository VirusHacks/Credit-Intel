'use client';

import { CreditApplication } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/format-utils';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ApplicationsTableProps {
  applications: CreditApplication[];
  onDelete?: (id: string) => void;
}

export function ApplicationsTable({
  applications,
  onDelete,
}: ApplicationsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CreditApplication;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });

  const sorted = [...applications].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }

    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortConfig.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">No applications found.</p>
        <Link href="/applications/new">
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            Create First Application
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Company</th>
            <th className="px-4 py-3 text-left font-medium">Industry</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Credit Score</th>
            <th className="px-4 py-3 text-right font-medium">Requested</th>
            <th className="px-4 py-3 text-left font-medium">Applied</th>
            <th className="px-4 py-3 text-center font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => (
            <tr key={app.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 font-medium">{app.company.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {app.businessDetails.industry}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    app.status
                  )}`}
                >
                  {app.status
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-semibold">
                  {app.creditAssessment.creditScore}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(app.requestedAmount)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(app.createdAt)}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Link href={`/applications/${app.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDelete?.(app.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
