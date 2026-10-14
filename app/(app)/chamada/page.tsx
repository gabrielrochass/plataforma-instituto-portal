import { ClipboardCheckIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClassDayList } from "@/components/attendance/session-lists";
import { getClassDays } from "@/lib/data/overview";
import { getViewer } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.attendance.take };

export default async function ChamadaResolverPage() {
  const viewer = await getViewer();
  const today = todayInRecife();
  const mine = await getClassDays(today, viewer.id);
  const items = mine.length > 0 ? mine : await getClassDays(today, null);
  const ordered = items
    .filter((item) => item.endsOn >= today || item.pending > 0)
    .sort(
      (a, b) =>
        Number(b.classToday) - Number(a.classToday) ||
        b.pending - a.pending ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  const todays = ordered.filter((item) => item.classToday && !item.takenToday);
  if (todays.length === 1 && mine.length > 0) {
    redirect(`/turmas/${todays[0].classId}/chamada` as Route);
  }

  return (
    <>
      <PageHeader
        title={m.attendance.chooseClass}
        subtitle={m.attendance.chooseHint}
      />
      {ordered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheckIcon}
          title={m.home.emptyTitle}
          description={m.attendance.noClasses}
        />
      ) : (
        <ClassDayList items={ordered} />
      )}
    </>
  );
}
