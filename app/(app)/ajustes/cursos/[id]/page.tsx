import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell/page-header";
import { CourseForm } from "@/components/settings/course-form";
import { getCourses } from "@/lib/data/classes";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.courses.edit };

export default async function CoursePage({
  params,
}: PageProps<"/ajustes/cursos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  await requireTeamManager();
  const course = (await getCourses()).find((candidate) => candidate.id === id);
  if (!course) notFound();

  return (
    <>
      <PageHeader
        title={course.name}
        back={{ href: "/ajustes/cursos", label: m.courses.title }}
      />
      <CourseForm course={course} />
    </>
  );
}
