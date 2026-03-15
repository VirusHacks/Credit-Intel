'use client';

import { Card } from '@/components/ui/card';
import {
  FileText,
  User,
  Lock,
  Database,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface AuditEntry {
  id: string;
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userEmail: string | null;
}

interface AuditResponse {
  logs: AuditEntry[];
  total: number;
  filters: {
    entityTypes: string[];
    actions: string[];
  };
}

const getEntityIcon = (entityType: string) => {
  switch (entityType.toLowerCase()) {
    case 'application': return <FileText className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    case 'user': return <User className="w-4 h-4" />;
    case 'assessment': return <Database className="w-4 h-4" />;
    case 'access': return <Lock className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterAction) params.set('action', filterAction);
        if (filterEntityType) params.set('entityType', filterEntityType);
        params.set('limit', '50');

        const res = await fetch(`/api/audit-logs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json() as AuditResponse;
          setLogs(data.logs);
          setTotal(data.total);
          setAvailableActions(data.filters.actions);
          setAvailableEntityTypes(data.filters.entityTypes);
        }
      } finally {
        setLoading(false);
      }
    }
    void fetchLogs();
  }, [filterAction, filterEntityType]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground block mb-2">Filter by Entity</label>
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-white/5 backdrop-blur-md text-white"
            >
              <option value="">All Entities</option>
              {availableEntityTypes.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground block mb-2">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-white/5 backdrop-blur-md text-white"
            >
              <option value="">All Actions</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 pt-6">
            <span className="text-sm text-muted-foreground">{total} total records</span>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
            <p className="text-xs text-muted-foreground mt-1">Pipeline activity and user actions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/40 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{log.userEmail ?? 'System'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        {getEntityIcon(log.entityType)}
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border border-white/10 ${log.action === 'denied' ? 'bg-white/20 text-white'
                          : log.action === 'created' ? 'bg-white/5 text-white/60'
                            : log.action === 'updated' ? 'bg-white/10 text-white/80'
                              : 'bg-white/5 text-white/40'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Panel */}
      {selectedLog && (
        <Card className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Audit Log Details</h3>
            <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Timestamp</p>
              <p className="font-medium text-foreground mt-1">{new Date(selectedLog.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User</p>
              <p className="font-medium text-foreground mt-1">{selectedLog.userEmail ?? 'System'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entity Type</p>
              <p className="font-medium text-foreground mt-1">{selectedLog.entityType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Action</p>
              <p className="font-medium text-foreground mt-1">{selectedLog.action}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entity ID</p>
              <p className="font-medium text-foreground mt-1 font-mono text-xs">{selectedLog.entityId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">IP Address</p>
              <p className="font-medium text-foreground mt-1">{selectedLog.ipAddress ?? '—'}</p>
            </div>
            {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Changes</p>
                <pre className="mt-1 p-3 bg-black/40 rounded-xl border border-white/10 text-xs overflow-auto max-h-[200px] font-mono shadow-inner text-white/60">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
