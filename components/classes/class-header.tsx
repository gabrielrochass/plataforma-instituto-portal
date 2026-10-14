import { PencilIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { SegmentedNav } from "@/components/app-shell/segmented-nav";
import { buttonVariants } from "@/components/ui/button";
import type { ClassSummary } from "@/lib/data/classes";
import { m } from "@/lib/i18n";

export function ClassHeader({ row }: { row: ClassSummary }) {
  const base = `/turmas/${row.id}`;
  return (
    <>
      <PageHeader
        title={row.name}
        subtitle={`${row.course_name}. ${row.unit_name}`}
        back={{ href: "/turmas", label: m.classes.title }}
        action={
          row.operable && row.status === "open" ? (
            <Link
              href={`${base}/editar` as Route}
              aria-label={m.classes.edit}
              className={buttonVariants({
                variant: "secondary",
                size: "icon-lg",
              })}
            >
              <PencilIcon aria-hidden="true" className="size-5" />
            </Link>
          ) : undefined
        }
      />
      <SegmentedNav
        label={m.classes.tabs}
        items={[
          { href: base as Route, label: m.classes.summary },
          { href: `${base}/alunos` as Route, label: m.classes.roster },
          { href: `${base}/aulas` as Route, label: m.classes.sessions },
          ...(row.operable
            ? [{ href: `${base}/notas` as Route, label: m.grades.tab }]
            : []),
          ...(row.operable && row.status === "finished"
            ? [
                {
                  href: `${base}/certificados` as Route,
                  label: m.certificates.tab,
                },
              ]
            : []),
        ]}
      />
    </>
  );
}
