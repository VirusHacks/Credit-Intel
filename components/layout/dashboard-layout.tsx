'use client';

import { AppSidebar } from './app-sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className={cn('ml-[240px] flex-1 min-w-0', className)}>
        {children}
      </main>
    </div>
  );
}
