import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  ConvertRequest,
  RequestDecision,
} from "@/components/requests/request-actions";
import { findStudents } from "@/lib/actions/students";
import { getClasses } from "@/lib/data/classes";
import { getRequest } from "@/lib/data/requests";
import { requireTeamManager } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { ageOn, displayName, formatPhone, whatsappHref } from "@/lib/people";

export const metadata: Metadata = { title: m.requests.title };

export default async function RequestPage({
  params,
}: PageProps<"/inscricoes/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await requireTeamManager();
  const request = await getRequest(id);
  if (!request || !request.enrollment_offers) notFound();
  const offer = request.enrollment_offers;
  const today = todayInRecife();
  const name = displayName(request);
  const course = offer.classes?.name ?? "";
  const [classes, matches] = await Promise.all([
    getClasses(),
    findStudents(request.full_name),
  ]);
  const openClasses = classes
    .filter(
      (row) =>
        row.unit_id === offer.unit_id &&
        row.status === "open" &&
        row.operable &&
        row.ends_on >= today,
    )
    .sort(
      (a, b) =>
        Number(b.id === offer.class_id) - Number(a.id === offer.class_id),
    );
  const details = [
    [
      m.requests.birthDate,
      `${formatFullDate(request.birth_date)}, ${m.requests.age(ageOn(request.birth_date, today))}`,
    ],
    [m.requests.phone, formatPhone(request.phone)],
    ...(request.email ? [[m.studentForm.email, request.email]] : []),
    ...(request.neighborhood
      ? [[m.requests.neighborhood, request.neighborhood]]
      : []),
    ...(request.guardian_name && request.guardian_phone
      ? [
          [
            m.requests.guardianTitle,
            `${request.guardian_name}, ${formatPhone(request.guardian_phone)}`,
          ],
        ]
      : []),
    [m.requests.protocol, request.protocol],
    [
      m.requests.receivedOn,
      formatFullDate(todayInRecife(new Date(request.created_at))),
    ],
  ];

  return (
    <>
      <PageHeader
        title={name}
        subtitle={`${course}, ${offer.units?.name ?? ""}, ${m.requests.status[request.status]}`}
        back={{ href: "/inscricoes" }}
      />
      <div className="flex flex-col gap-8">
        <dl className="divide-y overflow-hidden rounded-2xl bg-card">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-footnote font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="text-body tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {request.status === "converted" ? (
          request.student_id && (
            <Link
              href={`/alunos/${request.student_id}` as Route}
              className="text-body font-medium text-link"
            >
              {m.enrollment.openProfile}
            </Link>
          )
        ) : (
          <>
            <RequestDecision
              requestId={request.id}
              status={request.status}
              whatsappHref={`${whatsappHref(request.guardian_phone ?? request.phone)}?text=${encodeURIComponent(
                m.requests.whatsappMessage(
                  name.split(" ")[0],
                  course,
                  request.protocol,
                ),
              )}`}
            />
            {request.status !== "declined" &&
              request.status !== "withdrawn" && (
                <section
                  aria-labelledby="matricular"
                  className="flex flex-col gap-3"
                >
                  <h2
                    id="matricular"
                    className="px-1 text-title3 font-semibold"
                  >
                    {m.requests.enrollTitle}
                  </h2>
                  <ConvertRequest
                    requestId={request.id}
                    name={name}
                    defaultClassId={offer.class_id}
                    classes={openClasses.map((row) => ({
                      id: row.id,
                      label: row.name,
                    }))}
                    matches={matches.map((match) => ({
                      id: match.id,
                      label: `${match.name}, ${m.studentForm.matchDetail(match.birthYear, match.unitCode)}`,
                    }))}
                  />
                </section>
              )}
          </>
        )}
      </div>
    </>
  );
}
