import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  AnonymizeButton,
  ConsentRow,
  CpfForm,
  ExportButton,
} from "@/components/social/privacy-tools";
import { StudentHeader } from "@/components/students/student-header";
import { getAccessLog } from "@/lib/data/social";
import { getStudent, getStudentCpf } from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.privacyTools.title };

const kinds = ["data_processing", "image_use", "sensitive_data"] as const;

export default async function StudentDataPage({
  params,
}: PageProps<"/alunos/[id]/dados">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [viewer, student, access] = await Promise.all([
    getViewer(),
    getStudent(id),
    getStudentCpf(id),
  ]);
  if (!student || !access) notFound();
  const log = await getAccessLog(id);
  const p = m.privacyTools;

  return (
    <>
      <StudentHeader student={student} today={todayInRecife()} showSocial />
      <div className="flex flex-col gap-8">
        {access.anonymized && (
          <p className="rounded-2xl bg-card p-4 text-subhead">
            {p.isAnonymized}
          </p>
        )}
        {!access.anonymized && <CpfForm studentId={id} cpf={access.cpf} />}

        <section aria-labelledby="termos" className="flex flex-col gap-3">
          <h2 id="termos" className="px-1 text-title3 font-semibold">
            {p.consents}
          </h2>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {kinds.map((kind) => {
              const active = student.consents.find(
                (consent) =>
                  consent.kind === kind && consent.revoked_on === null,
              );
              return (
                <ConsentRow
                  key={kind}
                  studentId={id}
                  kind={kind}
                  consent={
                    active
                      ? {
                          id: active.id,
                          signedOn: active.signed_on,
                          label: p.signed(formatFullDate(active.signed_on)),
                        }
                      : null
                  }
                />
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="exportar" className="flex flex-col gap-3">
          <h2 id="exportar" className="px-1 text-title3 font-semibold">
            {p.export}
          </h2>
          <p className="px-1 text-subhead text-muted-foreground">
            {p.exportHint}
          </p>
          <ExportButton studentId={id} fileName={`aluno-${id.slice(0, 8)}`} />
        </section>

        <section aria-labelledby="acessos" className="flex flex-col gap-3">
          <h2 id="acessos" className="px-1 text-title3 font-semibold">
            {p.log}
          </h2>
          {log.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {p.logEmpty}
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-2xl bg-card">
              {log.map((entry) => (
                <li
                  key={`${entry.at}-${entry.action}-${entry.table_name}`}
                  className="px-4 py-3 text-subhead"
                >
                  {p.logLine(
                    entry.actor,
                    p.actions[entry.action as keyof typeof p.actions] ??
                      entry.action,
                    p.tables[entry.table_name as keyof typeof p.tables] ??
                      entry.table_name,
                    formatFullDate(todayInRecife(new Date(entry.at))),
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {viewer.isAdminGeral && !access.anonymized && (
          <section aria-labelledby="anonimizar" className="flex flex-col gap-3">
            <h2 id="anonimizar" className="px-1 text-title3 font-semibold">
              {p.anonymize}
            </h2>
            <p className="px-1 text-subhead text-muted-foreground">
              {p.anonymizeHint}
            </p>
            <AnonymizeButton studentId={id} />
          </section>
        )}
      </div>
    </>
  );
}
