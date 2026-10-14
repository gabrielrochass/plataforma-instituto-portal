import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.account.delete };

export default function DeleteAccountPage() {
  return (
    <>
      <PageHeader
        title={m.account.delete}
        back={{ href: "/ajustes/conta", label: m.account.title }}
      />
      <div className="flex flex-col gap-6">
        <p className="text-body">{m.account.deleteIntro}</p>
        <section
          aria-labelledby="o-que-e-apagado"
          className="flex flex-col gap-3 rounded-2xl bg-card p-5"
        >
          <h2 id="o-que-e-apagado" className="text-headline font-semibold">
            {m.account.deleteWhat}
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-subhead">
            {m.account.deleteItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-footnote text-muted-foreground">
            {m.account.deleteBackup}
          </p>
        </section>
        <Link
          href="/ajustes/conta/exportar"
          className="flex min-h-11 w-fit items-center gap-2 text-subhead font-medium text-link"
        >
          <DownloadIcon aria-hidden="true" className="size-5" />
          {m.account.deleteExportFirst}
        </Link>
        <DeleteAccountForm />
      </div>
    </>
  );
}
