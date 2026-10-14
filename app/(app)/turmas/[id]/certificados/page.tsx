import { BadgeCheckIcon, BanIcon, PrinterIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  IssueButton,
  RevokeButton,
} from "@/components/certificates/certificate-controls";
import { ClassHeader } from "@/components/classes/class-header";
import { buttonVariants } from "@/components/ui/button";
import { getCertificates } from "@/lib/data/certificates";
import { getClass } from "@/lib/data/classes";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { isAdminOf } from "@/lib/roles";

const c = m.certificates;

export const metadata: Metadata = { title: c.title };

export default async function ClassCertificatesPage({
  params,
}: PageProps<"/turmas/[id]/certificados">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [row, viewer] = await Promise.all([getClass(id), getViewer()]);
  if (!row || !row.operable) notFound();
  const certificates =
    row.status === "finished" ? await getCertificates(id) : [];
  const admin = isAdminOf(viewer, row.unit_id);
  const base = `/turmas/${id}/certificados/imprimir`;
  const valid = certificates.filter((certificate) => !certificate.revoked_at);

  return (
    <>
      <ClassHeader row={row} />
      <div className="flex flex-col gap-6">
        <p className="text-subhead text-muted-foreground">
          {row.status === "finished" ? c.intro : c.notFinished}
        </p>
        {row.status === "finished" && (
          <div className="flex flex-wrap gap-3">
            {admin && <IssueButton classId={id} />}
            {valid.length > 0 && (
              <Link
                href={base as Route}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                <PrinterIcon aria-hidden="true" />
                {c.printAll}
              </Link>
            )}
          </div>
        )}
        {row.status === "finished" &&
          (certificates.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {c.empty}
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {certificates.map((certificate) => {
                const revoked = certificate.revoked_at !== null;
                const StatusIcon = revoked ? BanIcon : BadgeCheckIcon;
                return (
                  <li
                    key={certificate.id}
                    className="flex min-h-15 items-center gap-3 px-4 py-3"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-body font-medium">
                        {certificate.student_name}
                      </span>
                      <span className="font-mono text-footnote text-muted-foreground tabular-nums">
                        {certificate.code}
                      </span>
                      <span className="flex items-center gap-1 text-footnote text-muted-foreground">
                        <StatusIcon aria-hidden="true" className="size-4" />
                        {revoked
                          ? `${c.revoked}: ${certificate.revoke_reason}`
                          : `${c.valid}, ${formatFullDate(certificate.issued_on)}`}
                      </span>
                    </span>
                    {!revoked && (
                      <Link
                        href={`${base}?codigo=${certificate.code}` as Route}
                        aria-label={c.print(certificate.student_name)}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "icon-lg",
                        })}
                      >
                        <PrinterIcon aria-hidden="true" className="size-5" />
                      </Link>
                    )}
                    {!revoked && admin && (
                      <RevokeButton
                        certificateId={certificate.id}
                        name={certificate.student_name}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
      </div>
    </>
  );
}
