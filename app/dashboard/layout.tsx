import { MainLayout } from "@/components/layouts/MainLayout";

/**
 * Dashboard layout wrapper.
 * Applies MainLayout to dashboard routes.
 * Implements Sprint 1.4: Core Layout & Navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
