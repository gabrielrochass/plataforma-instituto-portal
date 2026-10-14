import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { NoteComposer } from "@/components/students/note-composer";
import { StudentHeader } from "@/components/students/student-header";
import { getCaseNotes } from "@/lib/data/attendance";
import { getStudent } from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { formatFullDate, todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { can } from "@/lib/roles";
import { Constants } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: m.notes.title };

const teacherKinds = [
  "family_contact",
  "pedagogical",
  "incident",
  "achievement",
] as const;

export default async function StudentNotesPage({
  params,
  searchParams,
}: PageProps<"/alunos/[id]/acompanhamento">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [viewer, student, notes, query] = await Promise.all([
    getViewer(),
    getStudent(id),
    getCaseNotes(id),
    searchParams,
  ]);
  if (!student) notFound();
  const admin = can.manageTeam(viewer);
  const kinds = admin ? Constants.public.Enums.case_note_kind : teacherKinds;
  const initial = kinds.find((kind) => kind === query.tipo) ?? kinds[0];

  return (
    <>
      <StudentHeader
        student={student}
        today={todayInRecife()}
        showSocial={admin}
      />
      <div className="flex flex-col gap-8">
        <section
          aria-labelledby="nova-anotacao"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-0.5 px-1">
            <h2 id="nova-anotacao" className="text-title3 font-semibold">
              {m.notes.new}
            </h2>
            <p className="text-footnote text-muted-foreground">
              {m.notes.privacy}
            </p>
          </div>
          <NoteComposer
            studentId={student.id}
            kinds={kinds}
            initialKind={initial}
          />
        </section>
        <section aria-labelledby="anotacoes" className="flex flex-col gap-3">
          <h2 id="anotacoes" className="px-1 text-title3 font-semibold">
            {m.notes.title}
          </h2>
          {notes.length === 0 ? (
            <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
              {m.notes.empty}
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex flex-col gap-1 rounded-2xl bg-card p-4"
                >
                  <span className="text-footnote font-semibold text-link">
                    {m.notes.kinds[note.kind]}
                  </span>
                  <p className="text-body whitespace-pre-line">{note.body}</p>
                  <span className="text-footnote text-muted-foreground">
                    {m.notes.by(
                      note.profiles?.display_name ?? "",
                      formatFullDate(note.happened_on),
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
