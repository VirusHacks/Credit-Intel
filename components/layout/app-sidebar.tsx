"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  BarChart2,
  FileText,
  Brain,
  ShieldCheck,
  FolderOpen,
  CreditCard,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/applications", label: "Applications", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/analysis", label: "AI Analysis", icon: Brain },
  { href: "/audit", label: "Audit", icon: ShieldCheck },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "CI";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
          <CreditCard className="h-4 w-4" />
        </div>
        <span className="text-2xl font-semibold tracking-tight text-white">
          Credit Intel
        </span>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Overview
        </p>
        <nav className="flex flex-col gap-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="mt-6">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Account
            </p>
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">
                  {user.email}
                </p>
                <p className="text-[10px] capitalize text-white/40">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/10 px-3 py-3 flex flex-col gap-0.5">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Settings
        </p>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
            pathname === "/settings"
              ? "bg-white/10 text-white font-medium"
              : "text-white/50 hover:bg-white/5 hover:text-white/80"
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          Settings
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm text-white/50 hover:bg-white/5 hover:text-white/80"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
