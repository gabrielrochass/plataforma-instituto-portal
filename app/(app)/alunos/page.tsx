import { GraduationCapIcon } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.students.title };

export default function StudentsPage() {
  return (
    <>
      <PageHeader title={m.students.title} />
      <EmptyState
        icon={GraduationCapIcon}
        title={m.students.emptyTitle}
        description={m.students.emptyDescription}
      />
    </>
  );
}
