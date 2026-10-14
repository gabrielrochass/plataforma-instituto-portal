import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudentEditForm } from "@/components/students/student-edit-form";
import { getStudent } from "@/lib/data/students";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.students.edit };

export default async function EditStudentPage({
  params,
}: PageProps<"/alunos/[id]/editar">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await getViewer();
  const student = await getStudent(id);
  if (!student) notFound();
  return <StudentEditForm student={student} />;
}
