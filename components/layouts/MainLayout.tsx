"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocaleContext } from "@/components/providers/LocaleProvider";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  FileText,
  FolderTree,
  Users,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey =
  | "dashboard"
  | "accounts"
  | "transactions"
  | "reports"
  | "categories"
  | "counterparties";

interface NavItem {
  navKey: NavKey;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { navKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { navKey: "accounts", href: "/accounts", icon: Wallet },
  { navKey: "transactions", href: "/transactions", icon: Receipt },
  { navKey: "reports", href: "/reports", icon: BarChart3 },
  { navKey: "categories", href: "/settings/categories", icon: FolderTree },
  { navKey: "counterparties", href: "/settings/counterparties", icon: Users },
];

/**
 * Main layout component with sidebar navigation and header.
 * Implements Sprint 1.4: Core Layout & Navigation
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { mainLayout: t } = useLocaleContext();
  const shouldShowFab = pathname !== "/transactions/new";

  const metaName =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null;
  const username =
    metaName?.trim() ||
    user?.email?.replace("@pocketmate.local", "")?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    user?.email ||
    t.userFallback;

  async function handleLogout() {
    await logout();
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh overflow-x-hidden lg:min-h-screen" style={{ backgroundColor: "hsl(var(--main-bg))" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          "bg-sidebar-bg text-sidebar-foreground",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>PocketMate</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-hover"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/reports"
                  ? pathname.startsWith("/reports")
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-white shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "")} />
                  {t.nav[item.navKey]}
                </Link>
              );
            })}
          </nav>

          {/* Pro Tip Section */}
          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg bg-sidebar-hover/50 p-3">
              <p className="text-xs font-semibold text-sidebar-foreground mb-1">{t.proTipTitle}</p>
              <p className="text-xs text-sidebar-foreground/70">{t.proTipBody}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden lg:flex">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">{username}</span>
            </div>
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">{t.logout}</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto touch-pan-y p-4 [-webkit-overflow-scrolling:touch] lg:p-6"
          style={{ backgroundColor: "hsl(var(--main-bg))" }}
        >
          {children}
        </main>

        {/* Global primary action */}
        {shouldShowFab && (
          <Button
            asChild
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 h-12 -translate-x-1/2 rounded-full px-5 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:h-14 sm:px-5"
          >
            <Link href="/transactions/new" className="inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <span>{t.addTransaction}</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
