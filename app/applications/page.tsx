"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ApplicationsTable,
  AppListItem,
} from "@/components/tables/applications-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Plus, Loader2, Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_FILTERS = [
  { value: null, label: "All" },
  { value: "not_started", label: "Not Started" },
  { value: "analyzing", label: "Analyzing" },
  { value: "awaiting_qualitative", label: "Awaiting Input" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchApplications = async (filter: string | null) => {
    setLoading(true);
    try {
      const url = filter
        ? `/api/applications?status=${filter}&limit=100`
        : "/api/applications?limit=100";
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as { data: AppListItem[] };
        setApplications(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications(statusFilter);
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = search
    ? applications.filter(
        (a) =>
          (a.companyName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (a.industry ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : applications;

  return (
    <DashboardLayout>
      <div className="flex flex-col">
        {/* Sticky Header */}
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-5 text-4xl font-medium backdrop-blur-2xl">
          Applications
          <Link href="/applications/new">
            <Button className="flex items-center gap-2 bg-white text-black hover:bg-white/90 text-sm font-medium px-4 py-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </h1>

        {/* Main Content */}
        <div className="relative flex flex-col gap-6 p-6">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1">
              {PIPELINE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    statusFilter === f.value
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/40 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-white/10 backdrop-blur-md shadow-xl w-full sm:w-72">
              <Search className="h-4 w-4 text-white/40 shrink-0" />
              <Input
                placeholder="Search by company or industry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-transparent text-white placeholder:text-white/30 focus-visible:ring-0 p-0 h-auto"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            </div>
          ) : (
            <ApplicationsTable
              applications={filtered}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
