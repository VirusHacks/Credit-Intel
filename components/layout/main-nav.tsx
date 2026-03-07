'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BarChart3, LogOut, Menu, Settings, User, X, BarChart2, FileText, Brain, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

export function MainNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="hidden sm:inline">Intelli-Credit</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden gap-8 lg:flex">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Dashboard
          </Link>
          <Link
            href="/applications"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Applications
          </Link>
          <Link
            href="/analytics"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Analytics
          </Link>
          <Link
            href="/documents"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Documents
          </Link>
          <Link
            href="/analysis"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            AI Analysis
          </Link>
          <Link
            href="/audit"
            className="text-sm font-medium transition-colors hover:text-foreground/80"
          >
            Audit
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings')}
                className="hidden sm:inline-flex"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hidden sm:inline-flex"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t bg-background p-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/applications" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Applications
            </Link>
            <Link href="/analytics" className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> Analytics
            </Link>
            <Link href="/documents" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documents
            </Link>
            <Link href="/analysis" className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" /> AI Analysis
            </Link>
            <Link href="/audit" className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Audit
            </Link>
            <Link href="/settings" className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2 mt-2"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
