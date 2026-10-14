import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { ClosureForm, ClosureList } from "@/components/settings/closures";
import { getClosures } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { adminUnits, isAdminOf } from "@/lib/roles";

export const metadata: Metadata = { title: m.calendar.title };

export default async function CalendarPage() {
  const viewer = await requireTeamManager();
  const [closures, units] = await Promise.all([getClosures(), getUnits()]);
  const today = todayInRecife();
  const unitName = (id: string | null) =>
    units.find((unit) => unit.id === id)?.name ?? null;

  return (
    <>
      <PageHeader
        title={m.calendar.title}
        subtitle={m.calendar.intro}
        back={{ href: "/ajustes", label: m.nav.settings }}
      />
      <div className="flex flex-col gap-8">
        <ClosureList
          closures={closures
            .filter((closure) => closure.ends_on >= today)
            .filter((closure) =>
              closure.unit_id
                ? isAdminOf(viewer, closure.unit_id)
                : viewer.isAdminGeral,
            )
            .map((closure) => ({
              id: closure.id,
              unitName: unitName(closure.unit_id),
              startsOn: closure.starts_on,
              endsOn: closure.ends_on,
              reason: closure.reason,
            }))}
        />
        <section aria-labelledby="novo-recesso" className="flex flex-col gap-3">
          <h2 id="novo-recesso" className="px-1 text-title3 font-semibold">
            {m.calendar.new}
          </h2>
          <ClosureForm
            units={adminUnits(viewer, units)}
            allowAll={viewer.isAdminGeral}
          />
        </section>
      </div>
    </>
  );
}
