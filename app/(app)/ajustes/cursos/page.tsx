import { BookOpenIcon, PlusIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getCourses } from "@/lib/data/classes";
import { requireTeamManager } from "@/lib/data/viewer";
import { ruleSentence } from "@/lib/grading";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.courses.title };

export default async function CoursesPage() {
  await requireTeamManager();
  const courses = (await getCourses()).filter((course) => !course.archived_at);
  const newCourse = (
    <Link
      href="/ajustes/cursos/novo"
      className={buttonVariants({ size: "lg" })}
    >
      <PlusIcon aria-hidden="true" />
      {m.courses.new}
    </Link>
  );

  return (
    <>
      <PageHeader
        title={m.courses.title}
        back={{ href: "/ajustes", label: m.nav.settings }}
        action={courses.length > 0 ? newCourse : undefined}
      />
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title={m.courses.empty}
          description={m.courses.emptyHint}
          action={newCourse}
        />
      ) : (
        <LinkList
          links={courses.map((course) => ({
            href: `/ajustes/cursos/${course.id}` as Route,
            title: course.name,
            hint: `${m.courses.hoursLabel(course.workload_hours)}. ${ruleSentence(course.rules)}`,
            icon: BookOpenIcon,
            color: "chart-1",
          }))}
        />
      )}
    </>
  );
}
