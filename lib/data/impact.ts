import "server-only";

import { cache } from "react";
import { getCourses } from "@/lib/data/classes";
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
  async (from: string, to: string, unitId: string, courseId: string) => {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("impact_report", {
      p_from: from,
      p_to: to,
      p_unit_id: unitId || undefined,
      p_course_id: courseId || undefined,
    });
    if (error) throw error;
    return data as unknown as ImpactReport;
  },
);

export async function loadImpact(params: Record<string, unknown>) {
  const viewer = await requireTeamManager();
  const today = todayInRecife();
  const period = resolvePeriod(params.periodo, today);
  const [allUnits, allCourses] = await Promise.all([getUnits(), getCourses()]);
  const units = adminUnits(viewer, allUnits);
  const unitId = units.find((unit) => unit.id === params.unidade)?.id ?? "";
  const courseId =
    allCourses.find((course) => course.id === params.curso)?.id ?? "";
  const [report, previous] = await Promise.all([
    getImpact(period.from, period.to, unitId, courseId),
    getImpact(period.previousFrom, period.previousTo, unitId, courseId),
  ]);
  return {
    today,
    period,
    periods: periodKeys(today),
    units,
    unitId,
    unit: units.find((unit) => unit.id === unitId),
    courses: allCourses.map(({ id, name }) => ({ id, name })),
    courseId,
    course: allCourses.find((course) => course.id === courseId),
    report,
    previous,
    reference:
      period.key === lastTwelveMonths
        ? m.impact.previousTwelveMonths
        : String(Number(period.key) - 1),
  };
}
