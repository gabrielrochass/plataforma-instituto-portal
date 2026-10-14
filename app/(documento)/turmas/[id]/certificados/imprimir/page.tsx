import { ChevronLeftIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrintButton } from "@/components/app-shell/print-button";
import { CertificateSheet } from "@/components/certificates/certificate-sheet";
import { normalizeCertificateCode } from "@/lib/certificate";
import { getCertificates } from "@/lib/data/certificates";
import { getClass } from "@/lib/data/classes";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.certificates.title };

export default async function PrintCertificatesPage({
  params,
  searchParams,
}: PageProps<"/turmas/[id]/certificados/imprimir">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const row = await getClass(id);
  if (!row || !row.operable) notFound();
  const code = normalizeCertificateCode((await searchParams).codigo);
  const certificates = (await getCertificates(id)).filter(
    (certificate) =>
      !certificate.revoked_at && (!code || certificate.code === code),
  );
  if (certificates.length === 0) notFound();
  const host = (await headers()).get("host") ?? "";
  const verifyBase = `${host}/certificado`;

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/turmas/${id}/certificados` as Route}
          className="-ml-1 flex min-h-11 items-center gap-0.5 text-body text-link"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {m.certificates.backToClass}
        </Link>
        <PrintButton />
      </div>
      <h1 className="sr-only">
        {m.certificates.title}, {row.name}
      </h1>
      {certificates.map((certificate) => (
        <CertificateSheet
          key={certificate.id}
          certificate={certificate}
          verifyUrl={verifyBase}
        />
      ))}
    </div>
  );
}
