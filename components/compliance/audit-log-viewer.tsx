'use client';

import { Card } from '@/components/ui/card';
import {
  FileText,
  User,
  Lock,
  Database,
  MoreVertical,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  entityType: string;
  action: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failure';
}

const mockAuditLogs: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2024-03-15 14:32:01',
    user: 'analyst@example.com',
    entityType: 'Application',
    action: 'Updated',
    details: 'Status changed from "submitted" to "under_review"',
    ipAddress: '192.168.1.100',
    status: 'success',
  },
  {
    id: '2',
    timestamp: '2024-03-15 14:15:23',
    user: 'analyst@example.com',
    entityType: 'Document',
    action: 'Uploaded',
    details: '2023_Financial_Statement.pdf (2.4 MB)',
    ipAddress: '192.168.1.100',
    status: 'success',
  },
  {
    id: '3',
    timestamp: '2024-03-15 13:45:12',
    user: 'admin@example.com',
    entityType: 'Assessment',
    action: 'Created',
    details: 'Risk assessment for application APP-2024-001',
    ipAddress: '192.168.1.50',
    status: 'success',
  },
  {
    id: '4',
    timestamp: '2024-03-15 12:20:44',
    user: 'viewer@example.com',
    entityType: 'Access',
    action: 'Denied',
    details: 'Attempted access to admin settings without proper permissions',
    ipAddress: '192.168.1.200',
    status: 'failure',
  },
  {
    id: '5',
    timestamp: '2024-03-15 11:05:33',
    user: 'analyst@example.com',
    entityType: 'Application',
    action: 'Created',
    details: 'New application from Acme Corporation',
    ipAddress: '192.168.1.100',
    status: 'success',
  },
];

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'Application':
      return <FileText className="w-4 h-4" />;
    case 'Document':
      return <FileText className="w-4 h-4" />;
    case 'User':
      return <User className="w-4 h-4" />;
    case 'Assessment':
      return <Database className="w-4 h-4" />;
    case 'Access':
      return <Lock className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export function AuditLogViewer() {
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');

  const filteredLogs = filterAction
    ? mockAuditLogs.filter((log) => log.action === filterAction)
    : mockAuditLogs;

  const actions = Array.from(new Set(mockAuditLogs.map((log) => log.action)));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="flex items-center gap-2 text-gray-900">
                      {getEntityIcon(log.entityType)}
                      {log.entityType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status === 'success' ? 'Success' : 'Failure'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                      className="gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Panel */}
      {selectedLog && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Timestamp</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.timestamp}</p>
            </div>
            <div>
              <p className="text-gray-600">User</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.user}</p>
            </div>
            <div>
              <p className="text-gray-600">Entity Type</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.entityType}</p>
            </div>
            <div>
              <p className="text-gray-600">Action</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.action}</p>
            </div>
            <div>
              <p className="text-gray-600">IP Address</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.ipAddress}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p
                className={`font-medium mt-1 ${
                  selectedLog.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {selectedLog.status === 'success' ? 'Success' : 'Failure'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-600">Details</p>
              <p className="font-medium text-gray-900 mt-1">{selectedLog.details}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
