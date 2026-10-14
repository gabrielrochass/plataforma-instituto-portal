import Form from "next/form";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { m } from "@/lib/i18n";
import { lastTwelveMonths } from "@/lib/impact";

type Option = { id: string; name: string };

const labelClass = "text-subhead font-medium";

export function ImpactFilters({
  periods,
  period,
  units,
  unitId,
  courses,
  courseId,
}: {
  periods: readonly string[];
  period: string;
  units: readonly Option[];
  unitId: string;
  courses: readonly Option[];
  courseId: string;
}) {
  return (
    <Form
      action="/impacto"
      aria-label={m.impact.filters}
      className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="impacto-periodo" className={labelClass}>
          {m.impact.period}
        </label>
        <NativeSelect id="impacto-periodo" name="periodo" defaultValue={period}>
          {periods.map((key) => (
            <option key={key} value={key}>
              {key === lastTwelveMonths ? m.impact.lastTwelveMonths : key}
            </option>
          ))}
        </NativeSelect>
      </div>
      {units.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="impacto-unidade" className={labelClass}>
            {m.impact.unit}
          </label>
          <NativeSelect
            id="impacto-unidade"
            name="unidade"
            defaultValue={unitId}
          >
            <option value="">{m.impact.allUnits}</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : (
        <div className="hidden sm:block" />
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="impacto-curso" className={labelClass}>
          {m.impact.course}
        </label>
        <NativeSelect id="impacto-curso" name="curso" defaultValue={courseId}>
          <option value="">{m.impact.allCourses}</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="secondary" size="lg">
        {m.impact.apply}
      </Button>
    </Form>
  );
}
