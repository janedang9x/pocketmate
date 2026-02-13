import { MainLayout } from "@/components/layouts/MainLayout";

/**
 * Accounts layout wrapper.
 * Applies MainLayout to accounts routes so navigation and header remain visible.
 * Implements Sprint 1.4: Core Layout & Navigation
 */
export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
