import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { ExportList } from "@/components/settings/export-list";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.exportData.title };

export default function ExportPage() {
  return (
    <>
      <PageHeader
        title={m.exportData.title}
        back={{ href: "/ajustes/conta", label: m.account.title }}
      />
      <div className="flex flex-col gap-6">
        <p className="text-body text-muted-foreground">{m.exportData.intro}</p>
        <ExportList />
      </div>
    </>
  );
}
