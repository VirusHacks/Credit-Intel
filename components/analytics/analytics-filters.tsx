'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/stores/app-store';
import { Calendar, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function AnalyticsFilters() {
  const {
    filterStatus,
    filterIndustry,
    dateRangeStart,
    dateRangeEnd,
    setFilterStatus,
    setFilterIndustry,
    setDateRange,
    resetFilters,
  } = useAppStore();

  const [startDate, setStartDate] = useState(
    dateRangeStart ? dateRangeStart.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    dateRangeEnd ? dateRangeEnd.toISOString().split('T')[0] : ''
  );

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setDateRange(new Date(startDate), new Date(endDate));
    }
  };

  const statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected'];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'];

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Application Status
            </label>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').charAt(0).toUpperCase() +
                    status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Industry
            </label>
            <select
              value={filterIndustry || ''}
              onChange={(e) => setFilterIndustry(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="">All Industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={handleDateRangeChange}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              onBlur={handleDateRangeChange}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
