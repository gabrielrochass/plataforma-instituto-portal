import { BadgeCheckIcon, BanIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import { PublicHeader } from "@/components/brand/public-header";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import { normalizeCertificateCode } from "@/lib/certificate";
import { verifyCertificate } from "@/lib/data/certificates";
import { formatFullDate } from "@/lib/dates";
import { m } from "@/lib/i18n";

const c = m.certificates;

export const metadata: Metadata = {
  title: c.verifyTitle,
  robots: { index: false },
};

export default async function VerifyCertificatePage({
  searchParams,
}: PageProps<"/certificado">) {
  const { codigo } = await searchParams;
  const typed = typeof codigo === "string" ? codigo : "";
  const code = normalizeCertificateCode(typed);
  const found = code ? await verifyCertificate(code) : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 py-12">
      <PublicHeader title={c.verifyTitle} text={c.verifyText} />
      <Form action="/certificado" className="flex flex-col gap-4">
        <TextField
          label={c.verifyLabel}
          name="codigo"
          defaultValue={code ?? typed}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono"
        />
        <Button type="submit" size="lg">
          {c.verifyButton}
        </Button>
      </Form>
      {typed &&
        (found ? (
          <section
            aria-labelledby="resultado"
            className="flex flex-col gap-4 rounded-2xl bg-card p-5"
          >
            <h2
              id="resultado"
              className="flex items-center gap-2 text-headline font-semibold"
            >
              {found.revoked ? (
                <BanIcon aria-hidden="true" className="size-5" />
              ) : (
                <BadgeCheckIcon aria-hidden="true" className="size-5" />
              )}
              {found.revoked ? c.revokedTitle : c.validTitle}
            </h2>
            {found.revoked && (
              <p className="text-subhead text-muted-foreground">
                {c.revokedText}
              </p>
            )}
            <dl className="flex flex-col gap-3">
              {[
                [c.holder, found.student_name],
                [c.course, found.class_name],
                [c.workload, c.hours(found.workload_hours)],
                [
                  c.period,
                  c.periodRange(
                    formatFullDate(found.starts_on),
                    formatFullDate(found.ends_on),
                  ),
                ],
                [c.unit, found.unit_name],
                [c.issuedOn, formatFullDate(found.issued_on)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-footnote font-medium text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-body">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <section
            aria-labelledby="resultado"
            className="flex flex-col gap-1 rounded-2xl bg-card p-5"
          >
            <h2
              id="resultado"
              className="flex items-center gap-2 text-headline font-semibold"
            >
              <SearchXIcon aria-hidden="true" className="size-5" />
              {c.notFoundTitle}
            </h2>
            <p className="text-subhead text-muted-foreground">
              {c.notFoundText}
            </p>
          </section>
        ))}
    </div>
  );
}
