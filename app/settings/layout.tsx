import { MainLayout } from "@/components/layouts/MainLayout";

/**
 * Settings layout wrapper.
 * Applies MainLayout to settings routes (categories, counterparties).
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
