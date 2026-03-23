import { MainLayout } from "@/components/layouts/MainLayout";

/**
 * Transactions layout wrapper.
 * Applies MainLayout so the sidebar/navigation remains visible on transaction pages.
 * Aligns with Sprint 1.4: Core Layout & Navigation.
 */
export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}

