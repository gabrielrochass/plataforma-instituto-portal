import { PortalLogo } from "@/components/brand/portal-logo";
import type { Certificate } from "@/lib/data/certificates";
import { formatFullDate } from "@/lib/dates";
import { legal, m } from "@/lib/i18n";

const c = m.certificates;

export function CertificateSheet({
  certificate,
  verifyUrl,
}: {
  certificate: Certificate;
  verifyUrl: string;
}) {
  return (
    <section
      aria-label={`${c.certificate}, ${certificate.student_name}`}
      className="relative aspect-[297/210] w-full overflow-hidden rounded-2xl bg-card text-card-foreground [container-type:inline-size] [page:certificate] [print-color-adjust:exact] print:aspect-auto print:h-[210mm] print:w-[297mm] print:break-after-page print:rounded-none"
    >
      <div className="absolute inset-[3cqw] flex flex-col items-center justify-between border-[0.7cqw] border-double border-primary px-[5cqw] py-[3.5cqw] text-center">
        <PortalLogo className="h-[8cqw] w-auto" />
        <div className="flex flex-col items-center gap-[1.6cqw]">
          <h2 className="text-[4.6cqw] font-bold tracking-[0.25em] uppercase">
            {c.certificate}
          </h2>
          <p className="text-[1.9cqw]">{c.certifies}</p>
          <p className="text-[3.4cqw] font-semibold">
            {certificate.student_name}
          </p>
          <p className="max-w-[80cqw] text-[1.9cqw] leading-relaxed text-balance">
            {c.completed(
              certificate.course_name,
              certificate.workload_hours,
              formatFullDate(certificate.starts_on),
              formatFullDate(certificate.ends_on),
              certificate.unit_name,
            )}
          </p>
        </div>
        <div className="grid w-full grid-cols-3 items-end gap-[3cqw] text-[1.3cqw]">
          <p className="text-left">
            {c.place(formatFullDate(certificate.issued_on))}
          </p>
          <div className="flex flex-col items-center gap-[0.3cqw]">
            <span className="mb-[0.6cqw] w-full border-t border-current" />
            <span className="font-semibold">{legal.controller.president}</span>
            <span>
              {c.signatureRole}, {legal.controller.name}
            </span>
          </div>
          <p className="flex flex-col text-right">
            <span className="font-mono font-semibold tracking-wider">
              {certificate.code}
            </span>
            <span className="break-words">{c.verifyAt(verifyUrl)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
