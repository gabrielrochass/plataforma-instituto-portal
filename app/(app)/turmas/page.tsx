import { UsersRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.classes.title };

export default function ClassesPage() {
  return (
    <>
      <PageHeader title={m.classes.title} />
      <EmptyState
        icon={UsersRoundIcon}
        title={m.classes.emptyTitle}
        description={m.classes.emptyDescription}
      />
    </>
  );
}
