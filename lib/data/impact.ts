import "server-only";

import { cache } from "react";
import { getClasses } from "@/lib/data/classes";
import { getUnits } from "@/lib/data/team";
import { requireTeamManager } from "@/lib/data/viewer";
import { todayInRecife } from "@/lib/dates";
import { m } from "@/lib/i18n";
import {
  type ImpactReport,
  lastTwelveMonths,
  periodKeys,
  resolvePeriod,
} from "@/lib/impact";
import { adminUnits } from "@/lib/roles";
import { requireUser } from "@/lib/supabase/server";

const getImpact = cache(
  async (from: string, to: string, unitId: string, classId: string) => {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("impact_report", {
      p_from: from,
      p_to: to,
      p_unit_id: unitId || undefined,
      p_class_id: classId || undefined,
    });
    if (error) throw error;
    return data as unknown as ImpactReport;
  },
);

export async function loadImpact(params: Record<string, unknown>) {
  const viewer = await requireTeamManager();
  const today = todayInRecife();
  const period = resolvePeriod(params.periodo, today);
  const [allUnits, allClasses] = await Promise.all([getUnits(), getClasses()]);
  const units = adminUnits(viewer, allUnits);
  const unitId = units.find((unit) => unit.id === params.unidade)?.id ?? "";
  const classes = allClasses.filter(
    (row) => row.manageable && (!unitId || row.unit_id === unitId),
  );
  const classId = classes.find((row) => row.id === params.turma)?.id ?? "";
  const [report, previous] = await Promise.all([
    getImpact(period.from, period.to, unitId, classId),
    getImpact(period.previousFrom, period.previousTo, unitId, classId),
  ]);
  return {
    today,
    period,
    periods: periodKeys(today),
    units,
    unitId,
    unit: units.find((unit) => unit.id === unitId),
    classes: classes.map((row) => ({
      id: row.id,
      name: `${row.name}, ${row.unit_code}`,
    })),
    classId,
    selectedClass: classes.find((row) => row.id === classId),
    report,
    previous,
    reference:
      period.key === lastTwelveMonths
        ? m.impact.previousTwelveMonths
        : m.impact.previousYear(String(Number(period.key) - 1)),
  };
}
