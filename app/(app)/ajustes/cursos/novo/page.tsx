import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { CourseForm } from "@/components/settings/course-form";
import { requireTeamManager } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.courses.new };

export default async function NewCoursePage() {
  await requireTeamManager();

  return (
    <>
      <PageHeader
        title={m.courses.new}
        back={{ href: "/ajustes/cursos", label: m.courses.title }}
      />
      <CourseForm />
    </>
  );
}
